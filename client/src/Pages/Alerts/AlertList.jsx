import { useState } from 'react';
import { CheckCheck, Bell, Plus } from 'lucide-react';

import {
  useAlerts,
  useAcknowledgeAlert,
  useAlertStatistics,
} from '../../hooks/useAlerts';

import { usePagination } from '../../hooks/usePagination';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Pagination from '../../components/Common/Pagination';
import AlertComponent from '../../components/Common/Alert';

import {
  AlertList,
  AlertFilters,
} from '../../components/Alerts';

import CreateAlertModal from '../../components/Alerts/CreateAlertModal';

const AlertsPage = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: '',
    type: '',
  });

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const { user } = useAuth();

  const canCreate =
    user?.role === 'admin' ||
    user?.role === 'operator';

  // =========================================================
  // NOTIFICATION CONTEXT
  // =========================================================

  /*
   * We use NotificationContext for read/unread state so that
   * the Alerts page, Sidebar badge and Navbar badge stay
   * synchronized.
   */
  const {
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    loading: notificationsLoading,
  } = useNotifications();

  // =========================================================
  // PAGINATION
  // =========================================================

  const pagination = usePagination(1, 10);

  // =========================================================
  // QUERY PARAMETERS
  // =========================================================

  const queryParams = {
    page: pagination.page,
    limit: pagination.limit,
    ...Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) => value !== ''
      )
    ),
  };

  // =========================================================
  // ALERT QUERIES
  // =========================================================

  const {
    data,
    isLoading,
    isError,
    error,
  } = useAlerts(queryParams);

  const {
    data: statsData,
  } = useAlertStatistics();

  // =========================================================
  // MUTATIONS
  // =========================================================

  const acknowledgeMutation = useAcknowledgeAlert();

  // =========================================================
  // ALERT DATA
  // =========================================================

  const alerts = data?.data?.alerts || [];

  /*
   * The alert list endpoint already returns the unread count
   * for the current user.
   */
  const unreadCount =
    data?.data?.unreadCount ?? 0;

  const totalItems =
    data?.data?.pagination?.total ?? 0;

  /*
   * Statistics response:
   *
   * alertsAPI.getStatistics()
   *      ↓
   * response.data
   *      ↓
   * {
   *   success: true,
   *   data: {
   *     total,
   *     unreadCount,
   *     byPriority,
   *     byType,
   *     recent
   *   }
   * }
   */
  const stats = statsData?.data;

  // =========================================================
  // UPDATE PAGINATION TOTAL
  // =========================================================

  if (
    data?.data?.pagination?.total !== undefined &&
    pagination.total !== totalItems
  ) {
    pagination.setTotal(totalItems);
  }

  // =========================================================
  // FILTER HANDLERS
  // =========================================================

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

  // =========================================================
  // ALERT ACTIONS
  // =========================================================

  /*
   * Mark one alert as read.
   *
   * This uses NotificationContext so the Sidebar and Navbar
   * notification badges are updated as well.
   */
  const handleMarkAsRead = (id) => {
    markNotificationAsRead(id);
  };

  /*
   * Acknowledge an alert.
   */
  const handleAcknowledge = (id) => {
    acknowledgeMutation.mutate(id);
  };

  /*
   * Mark all alerts as read.
   *
   * Again, we use NotificationContext so every part of the
   * application receives the updated unread count.
   */
  const handleMarkAll = () => {
    markAllNotificationsAsRead();
  };

  // =========================================================
  // ACTIVE FILTERS
  // =========================================================

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== ''
  );

  // =========================================================
  // PRIORITY STATISTICS
  // =========================================================

  const criticalCount =
    stats?.byPriority?.find(
      (priority) => priority._id === 'critical'
    )?.count ?? 0;

  const highPriorityCount =
    stats?.byPriority?.find(
      (priority) => priority._id === 'high'
    )?.count ?? 0;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

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
                loading={notificationsLoading}
              >
                Mark All Read ({unreadCount})
              </Button>
            )}

          </div>
        }
      />

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* TOTAL ALERTS */}
        <Card padding="sm">
          <p className="text-xs text-secondary-500">
            Total Alerts
          </p>

          <p className="text-xl font-bold text-secondary-900 dark:text-white">
            {stats?.total ?? totalItems}
          </p>
        </Card>

        {/* UNREAD */}
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

        {/* CRITICAL */}
        <Card padding="sm">
          <p className="text-xs text-secondary-500">
            Critical
          </p>

          <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
            {criticalCount}
          </p>
        </Card>

        {/* HIGH PRIORITY */}
        <Card padding="sm">
          <p className="text-xs text-secondary-500">
            High Priority
          </p>

          <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
            {highPriorityCount}
          </p>
        </Card>

      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div className="mb-6">
        <AlertFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          showReset={hasActiveFilters}
        />
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

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

      {/* =====================================================
          ALERT LIST
      ====================================================== */}

      <AlertList
        alerts={alerts}
        loading={isLoading}
        onMarkAsRead={handleMarkAsRead}
        onAcknowledge={handleAcknowledge}
      />

      {/* =====================================================
          PAGINATION
      ====================================================== */}

      {!isLoading && alerts.length > 0 && (
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

      {/* =====================================================
          CREATE ALERT MODAL
      ====================================================== */}

      {canCreate && (
        <CreateAlertModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
};

export default AlertsPage;