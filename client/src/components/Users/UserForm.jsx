import { useState } from 'react';
import PropTypes from 'prop-types';
import { Save } from 'lucide-react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Checkbox from '../Common/Checkbox';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import {
  validateEmail,
  validateName,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from '../../utils/validation';

const UserForm = ({ initialData = null, onSubmit, loading = false, isEdit = false }) => {
  const [values, setValues] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    confirmPassword: '',
    role: initialData?.role || ROLES.OPERATOR,
    organization: initialData?.organization || '',
    phoneNumber: initialData?.phoneNumber || '',
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data) => {
    const errs = {};
    const nameErr = validateName(data.name);
    const emailErr = validateEmail(data.email);
    const phoneErr = validatePhone(data.phoneNumber);

    if (nameErr) errs.name = nameErr;
    if (emailErr) errs.email = emailErr;
    if (phoneErr) errs.phoneNumber = phoneErr;

    if (!isEdit) {
      const passErr = validatePassword(data.password);
      const confirmErr = validateConfirmPassword(data.password, data.confirmPassword);
      if (passErr) errs.password = passErr;
      if (confirmErr) errs.confirmPassword = confirmErr;
    } else if (data.password) {
      const passErr = validatePassword(data.password);
      const confirmErr = validateConfirmPassword(data.password, data.confirmPassword);
      if (passErr) errs.password = passErr;
      if (confirmErr) errs.confirmPassword = confirmErr;
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValues = { ...values, [name]: type === 'checkbox' ? checked : value };
    setValues(newValues);
    setTouched({ ...touched, [name]: true });
    const newErrors = validate(newValues);
    setErrors(newErrors);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors(validate(values));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setTouched(
      Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      organization: values.organization.trim(),
      phoneNumber: values.phoneNumber.trim(),
      isActive: values.isActive,
    };

    if (values.password) {
      payload.password = values.password;
    }

    onSubmit(payload);
  };

  const roleOptions = Object.values(ROLES).map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="User Information">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              placeholder="user@example.com"
              required
              disabled={isEdit}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Role"
              name="role"
              value={values.role}
              onChange={handleChange}
              onBlur={handleBlur}
              options={roleOptions}
              error={errors.role}
              touched={touched.role}
              required
            />
            <Input
              label="Organization"
              name="organization"
              value={values.organization}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Company / Institution"
            />
          </div>

          <Input
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            value={values.phoneNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.phoneNumber}
            touched={touched.phoneNumber}
            placeholder="+1 234 567 8900"
          />
        </div>
      </Card>

      <Card
        title={isEdit ? 'Change Password' : 'Password'}
        subtitle={isEdit ? 'Leave blank to keep current password' : undefined}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={isEdit ? 'New Password' : 'Password'}
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            touched={touched.password}
            placeholder="Min. 6 characters"
            required={!isEdit}
            helperText={!isEdit ? 'Must contain uppercase, lowercase & number' : undefined}
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirmPassword}
            touched={touched.confirmPassword}
            placeholder="Re-enter password"
            required={!isEdit}
          />
        </div>
      </Card>

      <Card title="Status">
        <Checkbox
          name="isActive"
          label="Account is active"
          checked={values.isActive}
          onChange={handleChange}
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" variant="primary" icon={Save} loading={loading}>
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

UserForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isEdit: PropTypes.bool,
};

export default UserForm;