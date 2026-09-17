import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Shield, Mail, Phone, Building, Calendar } from 'lucide-react';
import { useState } from 'react';
import {
  useUser,
  useDeleteUser,
  useToggleUserStatus,
  useUpdateUser,
} from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import LoadingScreen from '../../components/Common/LoadingScreen';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { UserForm } from '../../components/Users';
import { ROLE_LABELS } from '../../constants/roles';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import classNames from 'classnames';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError, error } = useUser(id);
  const deleteMutation = useDeleteUser();
  const updateMutation = useUpdateUser();
  const toggleMutation = useToggleUserStatus();

  const user = data?.data?.user;
  const isSelf = currentUser?._id === id;
  const isAdmin = currentUser?.role === 'admin';

  if (isLoading) return <LoadingScreen message="Loading user..." />;

  if (isError || !user) {
    return (
      <Alert
        type="danger"
        title="User not found"
        message={error?.userMessage || 'The requested user could not be loaded.'}
      />
    );
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    navigate(ROUTES.USERS);
  };

  const handleUpdate = async (payload) => {
    await updateMutation.mutateAsync({ id, data: payload });
    setIsEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleVariant = (role) => {
    const variants = { admin: 'danger', operator: 'primary', viewer: 'secondary' };
    return variants[role] || 'default';
  };

  if (isEditing) {
    return (
      <>
        <PageHeader
          title={`Edit ${user.name}`}
          breadcrumbs={[
            { label: 'Users', path: ROUTES.USERS },
            { label: user.name, path: `/users/${id}` },
            { label: 'Edit' },
          ]}
          actions={
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          }
        />
        <div className="max-w-3xl">
          <UserForm
            initialData={user}
            onSubmit={handleUpdate}
            loading={updateMutation.isPending}
            isEdit
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={user.name}
        subtitle={user.email}
        breadcrumbs={[
          { label: 'Users', path: ROUTES.USERS },
          { label: user.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => navigate(ROUTES.USERS)}
            >
              Back
            </Button>
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            {!isSelf && isAdmin && (
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Profile Information">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                  {user.name}
                </h3>
                <Badge variant={getRoleVariant(user.role)} dot className="mt-1">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-secondary-400 flex-shrink-0" />
                <span className="text-secondary-700 dark:text-secondary-300">
                  {user.email}
                </span>
              </li>
              {user.phoneNumber && (
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-secondary-400 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    {user.phoneNumber}
                  </span>
                </li>
              )}
              {user.organization && (
                <li className="flex items-center gap-3">
                  <Building size={16} className="text-secondary-400 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    {user.organization}
                  </span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <Calendar size={16} className="text-secondary-400 flex-shrink-0" />
                <span className="text-secondary-700 dark:text-secondary-300">
                  Joined {formatDate(user.createdAt, 'MMM dd, yyyy')}
                </span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <div className="space-y-3">
              <Badge variant={user.isActive ? 'success' : 'secondary'} dot>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {user.lastLogin && (
                <p className="text-xs text-secondary-500">
                  Last login: {formatRelativeTime(user.lastLogin)}
                </p>
              )}
              {!isSelf && isAdmin && (
                <Button
                  variant={user.isActive ? 'outline' : 'success'}
                  size="sm"
                  fullWidth
                  onClick={() => toggleMutation.mutate(id)}
                  loading={toggleMutation.isPending}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'} Account
                </Button>
              )}
            </div>
          </Card>

          <Card title="Permissions">
            <p className="text-xs text-secondary-500 mb-2">Based on role</p>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary-500" />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">
                {ROLE_LABELS[user.role]} Access
              </span>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${user.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default UserDetails;