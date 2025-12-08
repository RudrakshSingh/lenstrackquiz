import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, Printer, Send, Clock, User, Store as StoreIcon, DollarSign, UserCheck, ShoppingCart } from 'lucide-react';

export default function POSOrdersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (user?.organizationId) {
      fetchStores();
      fetchOrders();
    }
  }, [user, statusFilter, storeFilter]);

  const fetchStores = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/stores', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        const storesList = data.data || [];
        setStores(storesList.map(store => ({ 
          id: store.id || store._id?.toString(), 
          name: store.name, 
          code: store.code 
        })));
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (storeFilter) params.append('storeId', storeFilter);

      const response = await fetch(`/api/admin/orders?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        setOrders(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast('error', data.error?.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      showToast('error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (id) => {
    setDetailLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
      } else {
        showToast('error', data.error?.message || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
      showToast('error', 'Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = async (orderId) => {
    setActionLoading(`print-${orderId}`);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/orders/${orderId}/print`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Order marked as printed');
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          fetchOrderDetail(orderId);
        }
      } else {
        showToast('error', data.error?.message || 'Failed to print order');
      }
    } catch (error) {
      console.error('Print error:', error);
      showToast('error', 'Failed to print order');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePushToLab = async (orderId) => {
    setActionLoading(`push-${orderId}`);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/orders/${orderId}/push-to-lab`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Order pushed to lab successfully');
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          fetchOrderDetail(orderId);
        }
      } else {
        showToast('error', data.error?.message || 'Failed to push order to lab');
      }
    } catch (error) {
      console.error('Push error:', error);
      showToast('error', 'Failed to push order to lab');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'gray';
      case 'CUSTOMER_CONFIRMED':
        return 'blue';
      case 'STORE_ACCEPTED':
        return 'green';
      case 'PRINTED':
        return 'purple';
      case 'PUSHED_TO_LAB':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const columns = [
    {
      key: 'orderId',
      header: 'Order ID',
      render: (order) => (
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
          {order.orderId}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (order) => (
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Clock size={16} />
          <span className="text-sm">{formatTime(order.time || order.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (order) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-zinc-400" />
          <span className="text-zinc-900 dark:text-zinc-50">
            {order.customerName || (
              <span className="text-zinc-400 italic">Not provided</span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'store',
      header: 'Store',
      render: (order) => (
        <div className="flex items-center gap-2">
          <StoreIcon size={16} className="text-zinc-400" />
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-50">
              {order.store?.name || 'N/A'}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {order.store?.code || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <Badge color={getStatusBadgeColor(order.status)} variant="soft">
          {order.status?.replace(/_/g, ' ') || 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'staff',
      header: 'Staff',
      render: (order) => (
        <div className="flex items-center gap-2">
          {order.staff ? (
            <>
              <UserCheck size={16} className="text-zinc-400" />
              <div>
                <div className="text-zinc-900 dark:text-zinc-50">{order.staff.name}</div>
                {order.staff.role && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{order.staff.role}</div>
                )}
              </div>
            </>
          ) : (
            <span className="text-zinc-400 italic">Self-service</span>
          )}
        </div>
      ),
    },
    {
      key: 'finalAmount',
      header: 'Final Amount',
      render: (order) => (
        <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          <DollarSign size={16} />
          {formatCurrency(order.finalAmount)}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="POS Orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 tracking-tight">
              POS Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Manage online orders and sales
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
          <div className="flex-1">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'CUSTOMER_CONFIRMED', label: 'Customer Confirmed' },
                { value: 'STORE_ACCEPTED', label: 'Store Accepted' },
                { value: 'PRINTED', label: 'Printed' },
                { value: 'PUSHED_TO_LAB', label: 'Pushed to Lab' },
              ]}
            />
          </div>
          <div className="flex-1">
            <Select
              label="Store"
              value={storeFilter}
              onChange={(value) => setStoreFilter(value)}
              options={[
                { value: '', label: 'All Stores' },
                ...stores.map(store => ({
                  value: store.id,
                  label: `${store.name} (${store.code})`
                }))
              ]}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<ShoppingCart size={48} />}
                title="No orders found"
                description="There are no orders matching your filters."
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              loading={loading}
              emptyMessage="No orders found"
              rowActions={(order) => (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchOrderDetail(order.id);
                    }}
                    icon={<Eye size={14} />}
                    className="rounded-full"
                  >
                    View
                  </Button>
                  {(order.status === 'STORE_ACCEPTED' || order.status === 'CUSTOMER_CONFIRMED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(order.id);
                      }}
                      disabled={actionLoading === `print-${order.id}`}
                      icon={<Printer size={14} />}
                      className="rounded-full"
                    >
                      {actionLoading === `print-${order.id}` ? 'Printing...' : 'Print'}
                    </Button>
                  )}
                  {order.status === 'PRINTED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePushToLab(order.id);
                      }}
                      disabled={actionLoading === `push-${order.id}`}
                      icon={<Send size={14} />}
                      className="rounded-full"
                    >
                      {actionLoading === `push-${order.id}` ? 'Pushing...' : 'Push to Lab'}
                    </Button>
                  )}
                </div>
              )}
            />
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <Modal
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            title={`Order Details - ${selectedOrder.orderId}`}
            size="lg"
            footer={
              <div className="flex gap-2">
                {(selectedOrder.status === 'STORE_ACCEPTED' ||
                  selectedOrder.status === 'CUSTOMER_CONFIRMED') && (
                  <Button
                    onClick={() => handlePrint(selectedOrder.id)}
                    disabled={actionLoading === `print-${selectedOrder.id}`}
                    icon={<Printer size={16} />}
                    className="rounded-full"
                  >
                    {actionLoading === `print-${selectedOrder.id}` ? 'Printing...' : 'Print Order'}
                  </Button>
                )}
                {selectedOrder.status === 'PRINTED' && (
                  <Button
                    onClick={() => handlePushToLab(selectedOrder.id)}
                    disabled={actionLoading === `push-${selectedOrder.id}`}
                    icon={<Send size={16} />}
                    className="rounded-full"
                  >
                    {actionLoading === `push-${selectedOrder.id}` ? 'Pushing...' : 'Push to Lab'}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full"
                >
                  Close
                </Button>
              </div>
            }
          >
            {detailLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Order ID</label>
                    <div className="mt-1 font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                      {selectedOrder.orderId}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Status</label>
                    <div className="mt-1">
                      <Badge color={getStatusBadgeColor(selectedOrder.status)} variant="soft">
                        {selectedOrder.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Customer Name</label>
                    <div className="mt-1 text-zinc-900 dark:text-zinc-50">
                      {selectedOrder.customerName || (
                        <span className="text-zinc-400 italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Customer Phone</label>
                    <div className="mt-1 text-zinc-900 dark:text-zinc-50">
                      {selectedOrder.customerPhone || (
                        <span className="text-zinc-400 italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Store</label>
                    <div className="mt-1 text-zinc-900 dark:text-zinc-50">
                      {selectedOrder.store?.name || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Final Amount</label>
                    <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(selectedOrder.finalAmount)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Created At</label>
                    <div className="mt-1 text-zinc-900 dark:text-zinc-50">
                      {formatTime(selectedOrder.createdAt)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Sales Mode</label>
                    <div className="mt-1">
                      <Badge color={selectedOrder.salesMode === 'SELF_SERVICE' ? 'blue' : 'green'} variant="soft">
                        {selectedOrder.salesMode?.replace(/_/g, ' ') || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Frame Data */}
                {selectedOrder.frameData && (
                  <div>
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Frame Details</h3>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800">
                      <pre className="text-sm text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                        {JSON.stringify(selectedOrder.frameData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Lens Data */}
                {selectedOrder.lensData && (
                  <div>
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Lens Details</h3>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800">
                      <pre className="text-sm text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                        {JSON.stringify(selectedOrder.lensData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Offer Data */}
                {selectedOrder.offerData && (
                  <div>
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Offer Details</h3>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800">
                      <pre className="text-sm text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                        {JSON.stringify(selectedOrder.offerData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}

