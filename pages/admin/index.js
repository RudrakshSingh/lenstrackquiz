import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import { reportService } from '../../services/reports';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Users, CheckCircle, ShoppingCart, XCircle, Store, User, Package, HelpCircle, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import Badge from '../../components/ui/Badge';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    convertedSessions: 0,
    abandonedSessions: 0,
    totalStores: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalQuestions: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && !authLoading) {
      fetchDashboardData();
      
      // Auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000);
      
      return () => clearInterval(interval);
    } else if (!authLoading) {
      // If not authenticated and auth check is complete, stop loading
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReport('overview');
      // Handle both old and new response structures
      const data = response.data || response;
      if (data.stats) {
        setStats(data.stats);
      } else {
        // Fallback for old structure
        setStats({
          totalSessions: data.totalSessions || 0,
          completedSessions: data.completedSessions || 0,
          convertedSessions: data.convertedSessions || 0,
          abandonedSessions: data.abandonedSessions || 0,
          totalStores: data.totalStores || 0,
          totalUsers: data.totalUsers || 0,
          totalProducts: data.totalProducts || 0,
          totalQuestions: data.totalQuestions || 0,
        });
      }
      setRecentSessions(data.recentSessions || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Don't show error toast for auth errors - user will be redirected
      if (error.code !== 'AUTH_ERROR' && error.code !== 'UNKNOWN_ERROR' && error.message !== 'No token provided') {
        showToast('error', 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const sessionColumns = [
    { key: 'customerName', header: 'Customer' },
    { key: 'storeName', header: 'Store' },
    { key: 'staffName', header: 'Staff' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const statusColors = {
          IN_PROGRESS: 'blue',
          COMPLETED: 'green',
          CONVERTED: 'purple',
          ABANDONED: 'gray',
        };
        const color = statusColors[item.status] || 'gray';
        return (
          <Badge color={color} variant="soft" size="sm">
            {item.status?.replace('_', ' ') || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Time',
      render: (item) => format(new Date(item.createdAt), 'MMM d, h:mm a'),
    },
  ];

  const conversionRate = stats.totalSessions > 0 
    ? ((stats.convertedSessions / stats.totalSessions) * 100).toFixed(1)
    : 0;

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-xl p-8 text-white animate-fade-in hover-lift">
          <div className="flex items-center justify-between">
            <div className="animate-slide-in">
              <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
              <p className="text-indigo-100 text-lg">
                Here's what's happening with your business today
              </p>
            </div>
            <Activity className="h-16 w-16 opacity-30 animate-pulse-slow" />
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions.toLocaleString()}
            icon={<Users className="h-6 w-6" />}
            color="blue"
            trend={stats.totalSessions > 0 ? { value: 12, direction: 'up', label: 'vs last month' } : undefined}
          />
          <StatCard
            title="Completed"
            value={stats.completedSessions.toLocaleString()}
            icon={<CheckCircle className="h-6 w-6" />}
            color="green"
            trend={stats.completedSessions > 0 ? { value: 8, direction: 'up' } : undefined}
          />
          <StatCard
            title="Converted"
            value={stats.convertedSessions.toLocaleString()}
            icon={<ShoppingCart className="h-6 w-6" />}
            color="purple"
            trend={stats.convertedSessions > 0 ? { value: 15, direction: 'up' } : undefined}
          />
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="blue"
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center border-l-4 border-primary cursor-pointer hover-lift animate-fade-in"
            onClick={() => router.push('/admin/stores')}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="p-3 bg-primary-light rounded-lg mr-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Stores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStores}</p>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center border-l-4 border-success cursor-pointer hover-lift animate-fade-in"
            onClick={() => router.push('/admin/users')}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="p-3 bg-green-100 rounded-lg mr-4 transition-transform duration-300 hover:scale-110">
              <User className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Staff</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 transition-transform duration-300 hover:scale-105">{stats.totalUsers}</p>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center border-l-4 border-warning cursor-pointer hover-lift animate-fade-in"
            onClick={() => router.push('/admin/products')}
            style={{ animationDelay: '0.3s' }}
          >
            <div className="p-3 bg-yellow-100 rounded-lg mr-4 transition-transform duration-300 hover:scale-110">
              <Package className="h-8 w-8 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 transition-transform duration-300 hover:scale-105">{stats.totalProducts}</p>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center border-l-4 border-info cursor-pointer hover-lift animate-fade-in"
            onClick={() => router.push('/admin/questions')}
            style={{ animationDelay: '0.4s' }}
          >
            <div className="p-3 bg-blue-100 rounded-lg mr-4 transition-transform duration-300 hover:scale-110">
              <HelpCircle className="h-8 w-8 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Questions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 transition-transform duration-300 hover:scale-105">{stats.totalQuestions}</p>
            </div>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-blue-200 hover-lift animate-fade-in group"
            onClick={() => router.push('/admin/lenses')}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Lens Management</h3>
              <Package className="h-10 w-10 text-blue-600 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <p className="text-gray-600 mb-4">Manage lens products, specifications, and pricing</p>
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); router.push('/admin/lens-entry'); }}>
              Add New Lens
            </Button>
          </div>
          <div 
            className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-green-200 hover-lift animate-fade-in group"
            onClick={() => router.push('/admin/customers')}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Customer Data</h3>
              <Users className="h-10 w-10 text-green-600 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <p className="text-gray-600 mb-4">View customer information and lens recommendations</p>
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); router.push('/admin/customers'); }}>
              View Customers
            </Button>
          </div>
          <div 
            className="bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-purple-200 hover-lift animate-fade-in group"
            onClick={() => router.push('/admin/questions')}
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Question Builder</h3>
              <HelpCircle className="h-10 w-10 text-purple-600 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <p className="text-gray-600 mb-4">Create and manage questionnaire questions for the quiz</p>
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); router.push('/admin/questions'); }}>
              Manage Questions
            </Button>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
              <p className="text-sm text-gray-500 mt-1">Latest customer questionnaire sessions</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              Refresh
            </Button>
          </div>
          <div className="p-6">
            <DataTable
              columns={sessionColumns}
              data={recentSessions}
              loading={loading}
              emptyMessage="No recent sessions. Sessions will appear here once customers start using the questionnaire."
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
