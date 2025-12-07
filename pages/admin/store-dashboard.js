// pages/admin/store-dashboard.js
// Store Dashboard with order statistics (V1.0 Spec)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Store, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Printer, 
  Package,
  BarChart3,
  Calendar
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { api } from '../../lib/api-client';

export default function StoreDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    bySalesMode: { SELF_SERVICE: 0, STAFF_ASSISTED: 0 },
    totalRevenue: 0
  });
  const [orders, setOrders] = useState([]);
  const [dateRange, setDateRange] = useState('today'); // today, week, month

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchStatistics();
      fetchOrders();
    }
  }, [storeId, dateRange]);

  const fetchStores = async () => {
    try {
      const response = await api.get('/admin/stores', { isActive: true });
      if (response?.data?.stores) {
        setStores(response.data.stores);
        if (response.data.stores.length > 0 && !storeId) {
          setStoreId(response.data.stores[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!storeId) return;
    
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const response = await api.get('/api/admin/orders/statistics', {
        storeId,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      });

      if (response?.data) {
        setStats(response.data);
      } else if (response?.success && response?.data) {
        setStats(response.data);
      }

      if (response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchOrders = async () => {
    if (!storeId) return;
    
    try {
      const response = await api.get('/api/admin/orders', {
        storeId,
        limit: 50
      });

      if (response?.data?.orders) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'CUSTOMER_CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'STORE_ACCEPTED': return 'bg-green-100 text-green-800';
      case 'PRINTED': return 'bg-purple-100 text-purple-800';
      case 'PUSHED_TO_LAB': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4" />;
      case 'CUSTOMER_CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'STORE_ACCEPTED': return <CheckCircle className="w-4 h-4" />;
      case 'PRINTED': return <Printer className="w-4 h-4" />;
      case 'PUSHED_TO_LAB': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Dashboard</h1>
            <p className="text-gray-600">Monitor orders and performance</p>
          </div>

          {/* Store Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Store
            </label>
            <select
              value={storeId || ''}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a store...</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} {store.city ? `- ${store.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          {storeId && (
            <>
              {/* Date Range Selector */}
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => setDateRange('today')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    dateRange === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    dateRange === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    dateRange === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Last 30 Days
                </button>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Orders */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        ₹{stats.totalRevenue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Self-Service Ratio */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Self-Service</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.bySalesMode.SELF_SERVICE}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Staff-Assisted */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Staff-Assisted</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.bySalesMode.STAFF_ASSISTED}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Orders by Status
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium text-gray-600">{status}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.customerName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                order.salesMode === 'SELF_SERVICE'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {order.salesMode}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.assistedByName || order.assistedByStaffId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{order.finalPrice?.toLocaleString('en-IN') || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

