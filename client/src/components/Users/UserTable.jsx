import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { MoreVertical, Shield, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import Badge from '../Common/Badge';
import Table from '../Common/Table';
import Button from '../Common/Button';
import { ROLE_LABELS } from '../../constants/roles';
import { formatRelativeTime } from '../../utils/formatDate';
import { buildRoute } from '../../constants/routes';

const UserTable = ({ users, loading, onToggleStatus, onDelete, currentUserId }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const getRoleVariant = (role) => {
    const variants = {
      admin: 'danger',
      operator: 'primary',
      viewer: 'secondary',
    };
    return variants[role] || 'default';
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

  const columns = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
            {getInitials(value)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-secondary-900 dark:text-white truncate">
              {value}
            </p>
            <p className="text-xs text-secondary-500 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant={getRoleVariant(value)} size="sm" dot>
          {ROLE_LABELS[value]}
        </Badge>
      ),
    },
    {
      key: 'organization',
      label: 'Organization',
      render: (value) => (
        <span className="text-sm text-secondary-600 dark:text-secondary-400">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value, row) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm" dot>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-secondary-500">
          {value ? formatRelativeTime(value) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === row._id ? null : row._id);
            }}
            className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700"
            disabled={row._id === currentUserId}
          >
            <MoreVertical size={16} className="text-secondary-500" />
          </button>

          {openMenu === row._id && row._id !== currentUserId && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(null);
                }}
              />
              <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-secondary-800 rounded-lg shadow-dropdown border border-secondary-200 dark:border-secondary-700 py-1 animate-fade-in">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(row._id);
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  {row.isActive ? (
                    <>
                      <UserX size={14} />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      Activate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row);
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                >
                  <Shield size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={users}
      loading={loading}
      sortBy="name"
      sortOrder="asc"
      onRowClick={(row) => navigate(buildRoute.userDetails(row._id))}
      emptyMessage="No users found."
    />
  );
};

UserTable.propTypes = {
  users: PropTypes.array,
  loading: PropTypes.bool,
  onToggleStatus: PropTypes.func,
  onDelete: PropTypes.func,
  currentUserId: PropTypes.string,
};

export default UserTable;