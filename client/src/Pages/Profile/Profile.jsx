import { useState } from 'react';
import { Save, Mail, Phone, Building, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { authAPI } from '../../api/auth';
import { notificationService } from '../../services/notification.service';
import { validatePhone } from '../../utils/validation';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Badge from '../../components/Common/Badge';
import { ROLE_LABELS } from '../../constants/roles';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const validate = (values) => {
    const errors = {};
    if (values.name && values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    const phoneErr = validatePhone(values.phoneNumber);
    if (phoneErr) errors.phoneNumber = phoneErr;
    return errors;
  };

  const handleUpdateProfile = async (values) => {
    setSaving(true);
    try {
      const response = await authAPI.updateProfile(values);
      updateUser(response.data.user);
      notificationService.success('Profile updated successfully');
    } catch (error) {
      notificationService.error(error.userMessage || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const form = useForm(
    {
      name: user?.name || '',
      organization: user?.organization || '',
      phoneNumber: user?.phoneNumber || '',
    },
    validate,
    handleUpdateProfile
  );

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setChangingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      notificationService.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      notificationService.error(error.userMessage || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your personal information" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Personal Information">
            <form onSubmit={form.handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={form.values.name}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                error={form.errors.name}
                touched={form.touched.name}
                required
              />
              <Input
                label="Email"
                name="email"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Organization"
                  name="organization"
                  value={form.values.organization}
                  onChange={form.handleChange}
                  placeholder="Company / Institution"
                />
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={form.values.phoneNumber}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.errors.phoneNumber}
                  touched={form.touched.phoneNumber}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Change Password">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                error={passwordErrors.currentPassword}
                touched={!!passwordErrors.currentPassword}
                required
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                error={passwordErrors.newPassword}
                touched={!!passwordErrors.newPassword}
                helperText="Must contain uppercase, lowercase & number"
                required
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                error={passwordErrors.confirmPassword}
                touched={!!passwordErrors.confirmPassword}
                required
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={changingPassword}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Account Info">
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-2xl mb-3">
                {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                {user?.name}
              </h3>
              <Badge
                variant={user?.role === 'admin' ? 'danger' : 'primary'}
                className="mt-2"
                dot
              >
                {ROLE_LABELS[user?.role]}
              </Badge>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-secondary-400" />
                <span className="truncate">{user?.email}</span>
              </li>
              {user?.organization && (
                <li className="flex items-center gap-3">
                  <Building size={16} className="text-secondary-400" />
                  <span>{user.organization}</span>
                </li>
              )}
              {user?.phoneNumber && (
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-secondary-400" />
                  <span>{user.phoneNumber}</span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <Shield size={16} className="text-secondary-400" />
                <span>{ROLE_LABELS[user?.role]} Access</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;