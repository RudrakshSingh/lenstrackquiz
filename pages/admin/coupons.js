import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Ticket } from 'lucide-react';

// Client-safe DiscountType enum
const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT_AMOUNT: 'FLAT_AMOUNT',
  YOPO_LOGIC: 'YOPO_LOGIC',
  FREE_ITEM: 'FREE_ITEM',
  COMBO_PRICE: 'COMBO_PRICE',
};

export default function CouponsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscount: null,
    minCartValue: null,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      fetchCoupons();
    }
  }, [user]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/coupons?organizationId=${user.organizationId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setCoupons(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
      showToast('error', 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      description: '',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxDiscount: null,
      minCartValue: null,
      isActive: true,
    });
    setEditingCoupon(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || DiscountType.PERCENTAGE,
      discountValue: coupon.discountValue || 0,
      maxDiscount: coupon.maxDiscount || null,
      minCartValue: coupon.minCartValue || null,
      isActive: coupon.isActive !== false,
    });
    setEditingCoupon(coupon);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discountValue) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organizationId: user.organizationId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
        setIsCreateOpen(false);
        fetchCoupons();
      } else {
        showToast('error', data.error?.message || 'Failed to save coupon');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToast('error', 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/coupons/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Coupon deleted successfully');
        setDeleteConfirm(null);
        fetchCoupons();
      } else {
        showToast('error', data.error?.message || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'An error occurred');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (coupon) => (
        <Badge color="blue" variant="soft">
          {coupon.code}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (coupon) => (
        <span className="text-black">
          {coupon.description || '-'}
        </span>
      ),
    },
    {
      key: 'discountType',
      header: 'Discount',
      render: (coupon) => {
        if (coupon.discountType === 'PERCENTAGE') {
          return (
            <span className="text-black font-medium">
              {coupon.discountValue}%
              {coupon.maxDiscount && (
                <span className="text-xs text-black ml-1">
                  (max ₹{coupon.maxDiscount})
                </span>
              )}
            </span>
          );
        }
        return (
          <span className="text-black font-medium">
            ₹{coupon.discountValue}
          </span>
        );
      },
    },
    {
      key: 'minCartValue',
      header: 'Min Cart',
      render: (coupon) => (
        <span className="text-sm text-black">
          {coupon.minCartValue ? `₹${coupon.minCartValue}` : 'No minimum'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (coupon) => (
        <Badge color={coupon.isActive ? 'green' : 'gray'} variant="soft">
          {coupon.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Coupons Management">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold text-black">Discount Codes</h1>
            <p className="text-sm text-black mt-1">Create and manage promotional coupon codes</p>
          </div>
          <Button 
            onClick={handleCreate}
            icon={<Plus size={18} />}
            className="w-full sm:w-auto shrink-0"
          >
            Create Discount Code
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Ticket size={80} className="text-gray-300" />}
                title="No discount codes"
                description="Create your first promotional coupon code"
                action={{
                  label: 'Create Discount Code',
                  onClick: handleCreate,
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={coupons}
              loading={loading}
              emptyMessage="No coupons found"
              rowActions={(coupon) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(coupon);
                    }}
                    icon={<Edit2 size={14} />}
                    className="rounded-full"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(coupon);
                    }}
                    icon={<Trash2 size={14} />}
                    className="rounded-full"
                  >
                    Delete
                  </Button>
                </div>
              )}
            />
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingCoupon ? 'Edit Discount Code' : 'Create Discount Code'}
          size="md"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                loading={submitting}
                className="rounded-full"
              >
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Coupon Code *"
              value={formData.code}
              onChange={(value) => setFormData({ ...formData, code: value.toUpperCase() })}
              required
              placeholder="WELCOME10"
            />

            <Input
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Optional description"
            />

            <Select
              label="Discount Type *"
              value={formData.discountType}
              onChange={(value) => setFormData({ ...formData, discountType: value })}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage' },
                { value: 'FLAT_AMOUNT', label: 'Flat Amount' },
              ]}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={formData.discountType === 'PERCENTAGE' ? 'Discount % *' : 'Discount Amount (₹) *'}
                type="number"
                value={formData.discountValue?.toString() || ''}
                onChange={(value) => setFormData({ ...formData, discountValue: parseFloat(value) || 0 })}
                required
              />
              {formData.discountType === 'PERCENTAGE' && (
                <Input
                  label="Max Discount (₹)"
                  type="number"
                  value={formData.maxDiscount?.toString() || ''}
                  onChange={(value) => setFormData({ ...formData, maxDiscount: value ? parseFloat(value) : null })}
                  placeholder="Optional"
                />
              )}
            </div>

            <Input
              label="Minimum Cart Value (₹)"
              type="number"
              value={formData.minCartValue?.toString() || ''}
              onChange={(value) => setFormData({ ...formData, minCartValue: value ? parseFloat(value) : null })}
              placeholder="Optional - leave empty for no minimum"
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Active
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Coupon"
          size="sm"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm(null)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
                className="rounded-full"
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-black">
            Are you sure you want to delete coupon code <strong className="text-black">"{deleteConfirm?.code}"</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

