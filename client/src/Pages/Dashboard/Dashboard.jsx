import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Camera,
  Video,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useDashboardStats,
  useActivityTimeline,
  useSystemHealth,
} from '../../hooks/useDashboard';
import { isAdmin } from '../../utils/permissions';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Alert from '../../components/Common/Alert';
import {
  StatCard,
  ActivityChart,
  IncidentChart,
  RecentIncidents,
  RecentAlerts,
  SystemHealthCard,
} from '../../components/Dashboard';
import { ROLE_LABELS } from '../../constants/roles';

const Dashboard = () => {
  const { user } = useAuth();
  const [timelineDays, setTimelineDays] = useState(7);

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: timelineData,
    isLoading: timelineLoading,
    refetch: refetchTimeline,
  } = useActivityTimeline(timelineDays);

  const {
    data: healthData,
    isLoading: healthLoading,
  } = useSystemHealth(isAdmin(user?.role));

  const stats = statsData?.data;
  const timeline = timelineData?.data?.timeline || [];
  const health = healthData?.data;

  const handleRefresh = () => {
    refetchStats();
    refetchTimeline();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'User'}!`}
        subtitle={`Signed in as ${ROLE_LABELS[user?.role]} — here's what's happening`}
        actions={
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={statsLoading || timelineLoading}
          >
            Refresh
          </Button>
        }
      />

      {statsError && (
        <Alert
          type="danger"
          title="Failed to load dashboard data"
          message={statsErr?.userMessage || 'Please try again later.'}
          className="mb-6"
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Incidents"
          value={stats?.summary?.totalIncidents}
          icon={AlertTriangle}
          color="danger"
          trend={stats?.trends?.weeklyGrowth}
          trendLabel="vs last week"
          loading={statsLoading}
        />
        <StatCard
          title="Today's Incidents"
          value={stats?.summary?.todayIncidents}
          icon={TrendingUp}
          color="warning"
          trend={stats?.trends?.dailyGrowth}
          trendLabel="vs yesterday"
          loading={statsLoading}
        />
        <StatCard
          title="Active Alerts"
          value={stats?.summary?.criticalAlerts}
          icon={Bell}
          color="primary"
          loading={statsLoading}
        />
        <StatCard
          title="Total Videos"
          value={stats?.summary?.totalVideos}
          icon={Video}
          color="info"
          loading={statsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ActivityChart data={timeline} loading={timelineLoading} days={timelineDays} />
        </div>
        <div>
          <IncidentChart
            data={stats?.distribution?.bySeverity || []}
            title="By Severity"
            loading={statsLoading}
          />
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <IncidentChart
          data={stats?.distribution?.byType || []}
          title="By Type"
          type="bar"
          loading={statsLoading}
        />
        <IncidentChart
          data={stats?.distribution?.byStatus || []}
          title="By Status"
          loading={statsLoading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentIncidents
          incidents={stats?.recent?.incidents || []}
          loading={statsLoading}
        />
        <RecentAlerts
          alerts={stats?.recent?.alerts || []}
          loading={statsLoading}
        />
      </div>

      {/* System Health (Admin only) */}
      {isAdmin(user?.role) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemHealthCard health={health} loading={healthLoading} />
        </div>
      )}
    </>
  );
};

export default Dashboard;