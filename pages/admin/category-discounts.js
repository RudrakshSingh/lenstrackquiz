import { useState, useEffect, useCallback } from 'react';
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
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

const CustomerCategory = {
  STUDENT: 'STUDENT',
  DOCTOR: 'DOCTOR',
  TEACHER: 'TEACHER',
  ARMED_FORCES: 'ARMED_FORCES',
  SENIOR_CITIZEN: 'SENIOR_CITIZEN',
  CORPORATE: 'CORPORATE'
};

const CustomerCategoryLabels = {
  STUDENT: 'Student',
  DOCTOR: 'Doctor',
  TEACHER: 'Teacher',
  ARMED_FORCES: 'Armed Forces',
  SENIOR_CITIZEN: 'Senior Citizen',
  CORPORATE: 'Corporate'
};

export default function CategoryDiscountsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    customerCategory: CustomerCategory.STUDENT,
    brandCode: '*',
    discountPercent: 10,
    maxDiscount: null,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    if (!user?.organizationId) return;
    
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/category-discounts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        // Handle different response structures
        let discountsArray = [];
        if (Array.isArray(data.data)) {
          discountsArray = data.data;
        } else if (data.data && Array.isArray(data.data.discounts)) {
          discountsArray = data.data.discounts;
        } else if (data.data && typeof data.data === 'object') {
          discountsArray = Object.values(data.data).find(Array.isArray) || [];
        }
        setDiscounts(discountsArray);
      }
    } catch (error) {
      console.error('Failed to load category discounts:', error);
      showToast('error', 'Failed to load category discounts');
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId, showToast]);

  useEffect(() => {
    if (user?.organizationId) {
      fetchDiscounts();
    }
  }, [user?.organizationId, fetchDiscounts]);

  const handleCreate = () => {
    setFormData({
      customerCategory: CustomerCategory.STUDENT,
      brandCode: '*',
      discountPercent: 10,
      maxDiscount: null,
      isActive: true,
    });
    setEditingDiscount(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (discount) => {
    setFormData({
      customerCategory: discount.customerCategory || CustomerCategory.STUDENT,
      brandCode: discount.brandCode || '*',
      discountPercent: discount.discountPercent || 10,
      maxDiscount: discount.maxDiscount || null,
      isActive: discount.isActive !== false,
    });
    setEditingDiscount(discount);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerCategory || !formData.brandCode || formData.discountPercent === undefined) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const url = editingDiscount ? `/api/admin/category-discounts/${editingDiscount.id}` : '/api/admin/category-discounts';
      const method = editingDiscount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          discountPercent: parseFloat(formData.discountPercent) || 0,
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', editingDiscount ? 'Category discount updated successfully' : 'Category discount created successfully');
        setIsCreateOpen(false);
        fetchDiscounts();
      } else {
        showToast('error', data.error?.message || 'Failed to save category discount');
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
      const response = await fetch(`/api/admin/category-discounts/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Category discount deleted successfully');
        setDeleteConfirm(null);
        fetchDiscounts();
      } else {
        showToast('error', data.error?.message || 'Failed to delete category discount');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'An error occurred');
    }
  };

  const columns = [
    {
      key: 'customerCategory',
      header: 'Customer Category',
      render: (discount) => (
        <Badge color="blue" variant="soft">
          {CustomerCategoryLabels[discount.customerCategory] || discount.customerCategory}
        </Badge>
      ),
    },
    {
      key: 'brandCode',
      header: 'Brand Code',
      render: (discount) => (
        <span className="font-mono text-sm font-medium text-black">
          {discount.brandCode || '*'}
        </span>
      ),
    },
    {
      key: 'discountPercent',
      header: 'Discount',
      render: (discount) => (
        <span className="text-black font-medium">
          {discount.discountPercent}%
          {discount.maxDiscount && (
            <span className="text-xs text-black ml-1">
              (max ₹{discount.maxDiscount})
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (discount) => (
        <Badge color={discount.isActive ? 'green' : 'gray'} variant="soft">
          {discount.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Category Discounts Management">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold text-black">Category Pricing</h1>
            <p className="text-sm text-black mt-1">Set special pricing for different customer categories</p>
          </div>
          <Button 
            onClick={handleCreate}
            icon={<Plus size={18} />}
            className="w-full sm:w-auto shrink-0"
          >
            Add Category Pricing
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : discounts.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={<Tag size={80} className="text-gray-300" />}
                title="No category pricing"
                description="Set up special pricing for customer categories"
                action={{
                  label: 'Add Category Pricing',
                  onClick: handleCreate,
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={discounts}
              loading={loading}
              emptyMessage="No category discounts found"
              rowActions={(discount) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(discount);
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
                      setDeleteConfirm(discount);
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
          title={editingDiscount ? 'Edit Category Pricing' : 'Add Category Pricing'}
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
                {editingDiscount ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Customer Category *"
              value={formData.customerCategory}
              onChange={(value) => setFormData({ ...formData, customerCategory: value })}
              options={Object.entries(CustomerCategoryLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              required
            />

            <Input
              label="Brand Code *"
              value={formData.brandCode}
              onChange={(value) => setFormData({ ...formData, brandCode: value.toUpperCase() })}
              required
              placeholder="* for all brands"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Discount % *"
                type="number"
                value={formData.discountPercent?.toString() || ''}
                onChange={(value) => setFormData({ ...formData, discountPercent: parseFloat(value) || 0 })}
                required
                min="0"
                max="100"
              />
              <Input
                label="Max Discount (₹)"
                type="number"
                value={formData.maxDiscount?.toString() || ''}
                onChange={(value) => setFormData({ ...formData, maxDiscount: value ? parseFloat(value) : null })}
                placeholder="Optional"
                min="0"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-black dark:text-gray-300">
                Active
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Category Discount"
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
          <p className="text-black dark:text-gray-400">
            Are you sure you want to delete the discount for <strong className="text-black dark:text-white">"{CustomerCategoryLabels[deleteConfirm?.customerCategory] || deleteConfirm?.customerCategory}"</strong> - <strong className="text-black dark:text-white">"{deleteConfirm?.brandCode}"</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

