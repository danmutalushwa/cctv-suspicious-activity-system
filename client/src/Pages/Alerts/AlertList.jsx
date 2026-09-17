import { useState } from 'react';
import { CheckCheck, Bell, Plus } from 'lucide-react';
import {
  useAlerts,
  useMarkAlertAsRead,
  useMarkAllAlertsAsRead,
  useAcknowledgeAlert,
  useAlertStatistics,
} from '../../hooks/useAlerts';
import { usePagination } from '../../hooks/usePagination';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Pagination from '../../components/Common/Pagination';
import AlertComponent from '../../components/Common/Alert';
import { AlertList, AlertFilters } from '../../components/Alerts';
import CreateAlertModal from '../../components/Alerts/CreateAlertModal';
const AlertsPage = () => {
  
  // State
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: '',
    type: '',
  });
 
  // Authentication
  
  const { user } = useAuth();
  const canCreate =
    user?.role === 'admin' ||
    user?.role === 'operator';
  
  // Pagination
  
  const pagination = usePagination(1, 10);
  
  // Query Parameters
  
  const queryParams = {
    page: pagination.page,
    limit: pagination.limit,
    ...Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) => value !== ''
      )
    ),
  };
  
  // Alerts Queries
  
  const {
    data,
    isLoading,
    isError,
    error,
  } = useAlerts(queryParams);
  const { data: statsData } = useAlertStatistics();

  // Mutations
  
  const markAsReadMutation = useMarkAlertAsRead();
  const markAllMutation = useMarkAllAlertsAsRead();
  const acknowledgeMutation = useAcknowledgeAlert();
  
  // Alert Data
  
  const alerts = data?.data?.alerts || [];
  const unreadCount =
    data?.data?.unreadCount || 0;
  const totalItems =
    data?.data?.pagination?.total || 0;
  // Update pagination total
  if (
    data?.data?.pagination?.total !== undefined &&
    pagination.total !== totalItems
  ) {
    pagination.setTotal(totalItems);
  }
  const stats = statsData?.data;
  
  // Filter Handlers
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    pagination.setPage(1);
  };
  const handleReset = () => {
    setFilters({
      search: '',
      priority: '',
      status: '',
      type: '',
    });
    pagination.setPage(1);
  };
  
  // Alert Actions
  
  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };
  const handleAcknowledge = (id) => {
    acknowledgeMutation.mutate(id);
  };
  const handleMarkAll = () => {
    markAllMutation.mutate();
  };
  
  // Active Filters
  
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== ''
  );
  
  // Render
  
  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Monitor and respond to security alerts"
        actions={
          <div className="flex items-center gap-2">
            {/* New Alert - Admin & Operator only */}
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              >
                New Alert
              </Button>
            )}
            {/* Mark All Read */}
            {unreadCount > 0 && (
              <Button
                variant="outline"
                icon={CheckCheck}
                onClick={handleMarkAll}
                loading={markAllMutation.isPending}
              >
                Mark All Read ({unreadCount})
              </Button>
            )}
          </div>
        }
      />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Alerts */}
        <Card padding="sm">
          <p className="text-xs text-secondary-500">
            Total Alerts
          </p>
          <p className="text-xl font-bold text-secondary-900 dark:text-white">
            {stats?.total || 0}
          </p>
        </Card>
        {/* Unread */}
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-1">
            <Bell
              size={14}
              className="text-primary-500"
            />
            <p className="text-xs text-secondary-500">
              Unread
            </p>
          </div>
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {unreadCount}
          </p>
        </Card>
        {/* Critical */}
        <Card padding="sm">
          <p className="text-xs text-secondary-500">
            Critical
          </p>
          <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
            {stats?.byPriority?.find(
              (priority) =>
                priority._id === 'critical'
            )?.count || 0}
          </p>
        </Card>
        {/* High Priority */}
        <Card padding="sm">
          <p className="text-xs text-secondary-500">
            High Priority
          </p>
          <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
            {stats?.byPriority?.find(
              (priority) =>
                priority._id === 'high'
            )?.count || 0}
          </p>
        </Card>
      </div>
      
      
      <div className="mb-6">
        <AlertFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          showReset={hasActiveFilters}
        />
      </div>
      
      {isError && (
        <AlertComponent
          type="danger"
          title="Failed to load alerts"
          message={
            error?.userMessage ||
            'Please try again later.'
          }
          className="mb-6"
        />
      )}
    
      <AlertList
        alerts={alerts}
        loading={isLoading}
        onMarkAsRead={handleMarkAsRead}
        onAcknowledge={handleAcknowledge}
      />
      {!isLoading && alerts.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            pageSize={pagination.limit}
            onPageChange={pagination.setPage}
            onPageSizeChange={
              pagination.changeLimit
            }
          />
        </div>
      )}
      
      
      {canCreate && (
        <CreateAlertModal
          isOpen={showCreateModal}
          onClose={() =>
            setShowCreateModal(false)
          }
        />
      )}
    </>
  );
};
export default AlertsPage;

