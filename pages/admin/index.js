import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ShimmerCard from '../../components/ui/ShimmerCard';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { RefreshCw, Users, CheckCircle2, TrendingUp, XCircle } from 'lucide-react';

export default function DashboardPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    convertedSessions: 0,
    abandonedSessions: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatTimeAgo = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user?.organizationId) return;
    
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      if (!token) {
        showToast('error', 'Please login again');
        return;
      }

      // Fetch dashboard stats from reports API
      const reportsResponse = await fetch(`/api/admin/reports?type=overview&organizationId=${user.organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!reportsResponse.ok) {
        if (reportsResponse.status === 401) {
          // Token expired or invalid, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('lenstrack_token');
            window.location.href = '/admin/login';
          }
          return;
        }
        throw new Error(`HTTP error! status: ${reportsResponse.status}`);
      }
      
      const reportsData = await reportsResponse.json();

      if (reportsData.success) {
        setStats({
          totalSessions: reportsData.data.totalSessions || 0,
          completedSessions: reportsData.data.completedSessions || 0,
          convertedSessions: reportsData.data.convertedSessions || 0,
          abandonedSessions: reportsData.data.abandonedSessions || 0,
        });
      }

      // Fetch recent sessions
      try {
        const sessionsResponse = await fetch(`/api/admin/sessions?limit=10&organizationId=${user.organizationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!sessionsResponse.ok) {
          if (sessionsResponse.status === 401) {
            // Token expired or invalid, redirect to login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('lenstrack_token');
              window.location.href = '/admin/login';
            }
            return;
          }
          throw new Error(`HTTP error! status: ${sessionsResponse.status}`);
        }
        
        const sessionsData = await sessionsResponse.json();

        if (sessionsData.success) {
          const formattedSessions = (sessionsData.data || []).slice(0, 10).map((session) => ({
            id: session.id,
            customerName: session.customerName || 'Anonymous',
            storeName: session.storeName || session.store?.name || 'Unknown Store',
            staffName: session.userName || session.user?.name || 'N/A',
            status: session.status,
            startedAtRaw: session.startedAt || session.createdAt,
            startedAt: formatTimeAgo(session.startedAt || session.createdAt),
          }));
          setRecentSessions(formattedSessions);
        }
      } catch (sessionsError) {
        console.error('Failed to load sessions:', sessionsError);
        // Don't show error toast for sessions, just log it
        setRecentSessions([]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId, formatTimeAgo, showToast]);

  useEffect(() => {
    if (user?.organizationId) {
      loadDashboardData();
    }
  }, [user?.organizationId, loadDashboardData]);

  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      render: (session) => (
        <div>
          <p className="font-medium text-black">{session.customerName}</p>
        </div>
      ),
    },
    {
      key: 'storeName',
      header: 'Store',
      render: (session) => (
        <span className="text-sm text-black">{session.storeName}</span>
      ),
    },
    {
      key: 'staffName',
      header: 'Staff',
      render: (session) => (
        <span className="text-sm text-black">{session.staffName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (session) => {
        const colors = {
          CONVERTED: 'green',
          COMPLETED: 'blue',
          IN_PROGRESS: 'yellow',
          ABANDONED: 'red',
        };
        return (
          <Badge color={colors[session.status] || 'gray'} variant="soft">
            {session.status?.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'startedAt',
      header: 'Time',
      render: (session) => (
        <span className="text-sm text-black">{session.startedAt}</span>
      ),
    },
  ];

  const conversionRate = stats.totalSessions > 0
    ? ((stats.convertedSessions / stats.totalSessions) * 100).toFixed(1)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-black">Dashboard</h1>
            <p className="text-sm text-black mt-1">Welcome back, {user?.name || 'Admin'}</p>
          </div>
          <Button
            variant="outline"
            icon={<RefreshCw size={18} />}
            onClick={loadDashboardData}
            loading={loading}
            className="w-full sm:w-auto shrink-0"
          >
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
            </>
          ) : (
            <>
              <div className="animate-fly-in" style={{ animationDelay: '0ms' }}>
                <StatCard
                  title="Total Sessions"
                  value={stats.totalSessions}
                  icon={<Users size={24} />}
                  color="blue"
                  trend={{ value: 12, direction: 'up', label: 'vs last week' }}
                />
              </div>
              <div className="animate-fly-in" style={{ animationDelay: '100ms' }}>
                <StatCard
                  title="Completed Sessions"
                  value={stats.completedSessions}
                  icon={<CheckCircle2 size={24} />}
                  color="green"
                  trend={{ value: 8, direction: 'up', label: 'vs last week' }}
                />
              </div>
              <div className="animate-fly-in" style={{ animationDelay: '200ms' }}>
                <StatCard
                  title="Converted Sessions"
                  value={stats.convertedSessions}
                  icon={<TrendingUp size={24} />}
                  color="purple"
                  trend={{ value: 15, direction: 'up', label: 'vs last week' }}
                />
              </div>
              <div className="animate-fly-in" style={{ animationDelay: '300ms' }}>
                <StatCard
                  title="Conversion Rate"
                  value={`${conversionRate}%`}
                  icon={<XCircle size={24} />}
                  color="yellow"
                />
              </div>
            </>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Recent Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={recentSessions}
              loading={loading}
              emptyMessage="No sessions found"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
