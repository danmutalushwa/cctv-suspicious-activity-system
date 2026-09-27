import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { useUsers, useDeleteUser, useToggleUserStatus } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Pagination from '../../components/Common/Pagination';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import EmptyState from '../../components/Common/EmptyState';
import SearchBar from '../../components/Common/SearchBar';
import Select from '../../components/Common/Select';
import { UserTable } from '../../components/Users';
import { ROUTES } from '../../constants/routes';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

const UserList = () => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const pagination = usePagination(1, 10);
  const deleteMutation = useDeleteUser();
  const toggleMutation = useToggleUserStatus();

  const queryParams = {
    page: pagination.page,
    limit: pagination.limit,
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
  };

  const { data, isLoading, isError, error } = useUsers(queryParams);

  const users = data?.data?.users || [];
  const totalItems = data?.data?.pagination?.totalItems || 0;

  if (data?.data?.pagination?.totalItems !== undefined && pagination.total !== totalItems) {
    pagination.setTotal(totalItems);
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = (id) => {
    toggleMutation.mutate(id);
  };

  const hasFilters = search || roleFilter;

  const roleOptions = Object.values(ROLES).map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  }));

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage users and their permissions"
        actions={
          <Link to={ROUTES.ADD_USER}>
            <Button variant="primary" icon={Plus}>
              Add User
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Total Users</p>
          <p className="text-xl font-bold text-secondary-900 dark:text-white">
            {totalItems}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Admins</p>
          <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
            {users.filter((u) => u.role === 'admin').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Operators</p>
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {users.filter((u) => u.role === 'operator').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Viewers</p>
          <p className="text-xl font-bold text-secondary-600 dark:text-secondary-400">
            {users.filter((u) => u.role === 'viewer').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              pagination.setPage(1);
            }}
            placeholder="Search users by name or email..."
          />
          <Select
            name="role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              pagination.setPage(1);
            }}
            options={roleOptions}
            placeholder="All Roles"
          />
        </div>
      </div>

      {isError && (
        <Alert
          type="danger"
          title="Failed to load users"
          message={error?.userMessage || 'Please try again later.'}
          className="mb-6"
        />
      )}

      {/* Users Table */}
      {!isLoading && users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={hasFilters ? 'No users found' : 'No users yet'}
          description={
            hasFilters
              ? 'Try adjusting your filters.'
              : 'Add your first user to get started.'
          }
          action={
            <Link to={ROUTES.ADD_USER}>
              <Button variant="primary" icon={Plus}>
                Add User
              </Button>
            </Link>
          }
        />
      ) : (
        <UserTable
          users={users}
          loading={isLoading}
          onToggleStatus={handleToggleStatus}
          onDelete={setDeleteTarget}
          currentUserId={currentUser?._id}
        />
      )}

      {/* Pagination */}
      {!isLoading && users.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            pageSize={pagination.limit}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.changeLimit}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default UserList;