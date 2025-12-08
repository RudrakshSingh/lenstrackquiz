import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, TrendingUp, Users, CheckCircle2, XCircle } from 'lucide-react';

// StatCard component for metrics
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-black mb-1">{title}</p>
          <p className="text-3xl font-bold text-black">{value}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Overview data
  const [overviewData, setOverviewData] = useState(null);

  // Store-wise data
  const [storeStats, setStoreStats] = useState([]);

  // Category data
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    if (user?.organizationId) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId, reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const params = new URLSearchParams({ 
        type: reportType,
        organizationId: user.organizationId 
      });

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();

      if (data.success) {
        if (reportType === 'overview') {
          setOverviewData(data.data);
        } else if (reportType === 'store') {
          setStoreStats(data.data.stores || []);
        } else if (reportType === 'category') {
          setCategoryStats(data.data.categories || []);
        }
      } else {
        showToast('error', data.error?.message || 'Failed to load report');
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      showToast('error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const storeColumns = [
    {
      key: 'storeName',
      header: 'Store Name',
      render: (store) => (
        <span className="font-medium text-black">{store.storeName}</span>
      ),
    },
    {
      key: 'totalSessions',
      header: 'Total Sessions',
      render: (store) => (
        <span className="text-black">{store.totalSessions}</span>
      ),
    },
    {
      key: 'completedSessions',
      header: 'Completed',
      render: (store) => (
        <span className="text-green-600 dark:text-green-400 font-medium">
          {store.completedSessions}
        </span>
      ),
    },
    {
      key: 'convertedSessions',
      header: 'Converted',
      render: (store) => (
        <span className="text-purple-600 dark:text-purple-400 font-medium">
          {store.convertedSessions}
        </span>
      ),
    },
    {
      key: 'completionRate',
      header: 'Completion Rate',
      render: (store) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${store.completionRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {store.completionRate}%
          </span>
        </div>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Conversion Rate',
      render: (store) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${store.conversionRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {store.conversionRate}%
          </span>
        </div>
      ),
    },
  ];

  const categoryColumns = [
    {
      key: 'category',
      header: 'Category',
      render: (cat) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {cat.category.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'sessionCount',
      header: 'Sessions',
      render: (cat) => (
        <span className="text-zinc-700 dark:text-zinc-300">{cat.sessionCount}</span>
      ),
    },
    {
      key: 'convertedCount',
      header: 'Converted',
      render: (cat) => (
        <span className="text-purple-600 dark:text-purple-400 font-medium">
          {cat.convertedCount}
        </span>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Conversion Rate',
      render: (cat) => (
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{ width: `${cat.conversionRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {cat.conversionRate}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Analytics & Reports
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-2">
              Track business performance and customer insights
            </p>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="mb-6">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(value) => setReportType(value)}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'store', label: 'Store-wise Performance' },
              { value: 'category', label: 'Category Breakdown' },
            ]}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Spinner />
            <p className="text-zinc-600 dark:text-zinc-400 mt-4">Loading report...</p>
          </div>
        )}

        {/* Overview Report */}
        {reportType === 'overview' && overviewData && !loading && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Sessions"
                value={overviewData.totalSessions}
                icon={<BarChart3 size={24} />}
                color="blue"
              />
              <StatCard
                title="Completed Sessions"
                value={overviewData.completedSessions}
                icon={<CheckCircle2 size={24} />}
                color="green"
              />
              <StatCard
                title="Converted Sessions"
                value={overviewData.convertedSessions}
                icon={<TrendingUp size={24} />}
                color="purple"
              />
              <StatCard
                title="Abandoned Sessions"
                value={overviewData.abandonedSessions}
                icon={<XCircle size={24} />}
                color="red"
              />
            </div>

            {/* Rates Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      Completion Rate
                    </h3>
                    <CheckCircle2 className="text-green-500" size={24} />
                  </div>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {overviewData.completionRate}%
                  </div>
                  <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${overviewData.completionRate}%` }}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      Conversion Rate
                    </h3>
                    <TrendingUp className="text-purple-500" size={24} />
                  </div>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {overviewData.conversionRate}%
                  </div>
                  <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${overviewData.conversionRate}%` }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Daily Trend */}
            {overviewData.dailyTrend && overviewData.dailyTrend.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                    Daily Trend (Last 7 Days)
                  </h2>
                  <div className="space-y-3">
                    {overviewData.dailyTrend.map((day, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 w-32">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-8 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full flex items-center px-3 text-white text-sm font-medium transition-all duration-500"
                            style={{
                              width: `${Math.max(Math.min((day.sessions / 20) * 100, 100), 5)}%`,
                            }}
                          >
                            {day.sessions} sessions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Store-wise Report */}
        {reportType === 'store' && !loading && (
          <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <DataTable columns={storeColumns} data={storeStats} loading={loading} emptyMessage="No store data available" />
          </div>
        )}

        {/* Category Report */}
        {reportType === 'category' && !loading && (
          <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <DataTable columns={categoryColumns} data={categoryStats} loading={loading} emptyMessage="No category data available" />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
