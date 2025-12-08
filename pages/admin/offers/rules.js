import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import DataTable from '../../../components/ui/DataTable';
import EmptyState from '../../../components/ui/EmptyState';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

// Client-safe enums
const OfferRuleType = {
  YOPO: 'YOPO',
  COMBO_PRICE: 'COMBO_PRICE',
  FREE_LENS: 'FREE_LENS',
  PERCENT_OFF: 'PERCENT_OFF',
  FLAT_OFF: 'FLAT_OFF',
  BOG50: 'BOG50',
  CATEGORY_DISCOUNT: 'CATEGORY_DISCOUNT',
  BONUS_FREE_PRODUCT: 'BONUS_FREE_PRODUCT',
};

const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT_AMOUNT: 'FLAT_AMOUNT',
  YOPO_LOGIC: 'YOPO_LOGIC',
  FREE_ITEM: 'FREE_ITEM',
  COMBO_PRICE: 'COMBO_PRICE',
};

export default function OfferRulesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    offerType: OfferRuleType.PERCENT_OFF,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    priority: 100,
    isActive: true,
    isSecondPairRule: false,
    lensBrandLines: [],
    lensItCodes: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [brands, setBrands] = useState([]);
  const [subBrands, setSubBrands] = useState([]);
  const [brandSubBrandMap, setBrandSubBrandMap] = useState({});
  const [availableSubBrands, setAvailableSubBrands] = useState([]);

  useEffect(() => {
    if (user?.organizationId) {
      fetchRules();
      fetchBrands();
    }
  }, [user]);

  // Update available sub-brands when brand changes
  useEffect(() => {
    if (formData.frameBrand && brandSubBrandMap[formData.frameBrand]) {
      setAvailableSubBrands(brandSubBrandMap[formData.frameBrand]);
    } else {
      setAvailableSubBrands(subBrands);
    }
  }, [formData.frameBrand, brandSubBrandMap, subBrands]);

  const fetchBrands = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/products/brands', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setBrands(data.data?.brands || []);
        setSubBrands(data.data?.subBrands || []);
        setBrandSubBrandMap(data.data?.brandSubBrandMap || {});
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/offers/rules?organizationId=${user.organizationId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setRules(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to load offer rules:', error);
      showToast('error', 'Failed to load offer rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      code: '',
      offerType: OfferRuleType.PERCENT_OFF,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 0,
      priority: 100,
      isActive: true,
      isSecondPairRule: false,
      lensBrandLines: [],
      lensItCodes: [],
    });
    setEditingRule(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (rule) => {
    setFormData({
      name: rule.name || '',
      code: rule.code || '',
      offerType: rule.offerType || OfferRuleType.PERCENT_OFF,
      discountType: rule.discountType || DiscountType.PERCENTAGE,
      discountValue: rule.discountValue || 0,
      frameBrand: rule.frameBrand || null,
      frameSubCategory: rule.frameSubCategory || null,
      minFrameMRP: rule.minFrameMRP || null,
      maxFrameMRP: rule.maxFrameMRP || null,
      comboPrice: rule.comboPrice || null,
      priority: rule.priority || 100,
      isActive: rule.isActive !== false,
      isSecondPairRule: rule.isSecondPairRule || false,
      secondPairPercent: rule.secondPairPercent || null,
      lensBrandLines: rule.lensBrandLines || [],
      lensItCodes: rule.lensItCodes || [],
    });
    setEditingRule(rule);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const url = editingRule
        ? `/api/admin/offers/rules/${editingRule.id}`
        : '/api/admin/offers/rules';
      const method = editingRule ? 'PUT' : 'POST';

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
        showToast('success', editingRule ? 'Offer rule updated successfully' : 'Offer rule created successfully');
        setIsCreateOpen(false);
        fetchRules();
      } else {
        showToast('error', data.error?.message || 'Failed to save offer rule');
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
      const response = await fetch(`/api/admin/offers/rules/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        showToast('success', 'Offer rule deleted successfully');
        setDeleteConfirm(null);
        fetchRules();
      } else {
        showToast('error', data.error?.message || 'Failed to delete offer rule');
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
      render: (rule) => (
        <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {rule.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (rule) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{rule.name}</span>
      ),
    },
    {
      key: 'frameBrand',
      header: 'Frame Brand',
      render: (rule) => (
        <div className="flex gap-2">
          <Badge color="blue" variant="soft">
            {rule.frameBrand || 'Any'}
          </Badge>
          {rule.frameSubCategory && (
            <Badge color="green" variant="soft">
              {rule.frameSubCategory}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'offerType',
      header: 'Type',
      render: (rule) => (
        <Badge color={rule.isActive ? 'purple' : 'gray'} variant="soft">
          {rule.offerType}
        </Badge>
      ),
    },
    {
      key: 'discountType',
      header: 'Discount',
      render: (rule) => {
        if (rule.discountType === 'YOPO_LOGIC') return <span className="text-sm">YOPO</span>;
        if (rule.discountType === 'COMBO_PRICE') return <span className="text-sm">Combo ₹{rule.comboPrice}</span>;
        if (rule.discountType === 'FREE_ITEM') return <span className="text-sm">Free Item</span>;
        if (rule.discountType === 'PERCENTAGE') return <span className="text-sm font-medium">{rule.discountValue}%</span>;
        return <span className="text-sm font-medium">₹{rule.discountValue}</span>;
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (rule) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{rule.priority}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (rule) => (
        <Badge color={rule.isActive ? 'green' : 'gray'} variant="soft">
          {rule.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Offer Rules Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 tracking-tight">
              Offer Rules
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Manage offer rules and discount logic
            </p>
          </div>
          <Button 
            onClick={handleCreate}
            icon={<Plus size={18} />}
            className="rounded-full"
          >
            Create Rule
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Tag size={48} />}
                title="No offer rules"
                description="Create your first offer rule to get started"
                action={{
                  label: 'Create Rule',
                  onClick: handleCreate,
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rules}
              loading={loading}
              emptyMessage="No offer rules found"
              rowActions={(rule) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(rule);
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
                      setDeleteConfirm(rule);
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
          title={editingRule ? 'Edit Offer Rule' : 'Create Offer Rule'}
          size="lg"
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
                {editingRule ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name *"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                placeholder="e.g., Summer Sale"
              />
              <Input
                label="Code *"
                value={formData.code}
                onChange={(value) => setFormData({ ...formData, code: value.toUpperCase() })}
                required
                placeholder="e.g., SUMMER2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Offer Type *"
                value={formData.offerType}
                onChange={(value) => setFormData({ ...formData, offerType: value })}
                options={[
                  { value: 'YOPO', label: 'YOPO' },
                  { value: 'COMBO_PRICE', label: 'COMBO PRICE' },
                  { value: 'FREE_LENS', label: 'FREE LENS' },
                  { value: 'PERCENT_OFF', label: 'PERCENT OFF' },
                  { value: 'FLAT_OFF', label: 'FLAT OFF' },
                  { value: 'BOG50', label: 'BOG50' },
                  { value: 'CATEGORY_DISCOUNT', label: 'CATEGORY DISCOUNT' },
                  { value: 'BONUS_FREE_PRODUCT', label: 'BONUS FREE PRODUCT' },
                ]}
              />
              <Select
                label="Discount Type *"
                value={formData.discountType}
                onChange={(value) => setFormData({ ...formData, discountType: value })}
                options={[
                  { value: 'PERCENTAGE', label: 'PERCENTAGE' },
                  { value: 'FLAT_AMOUNT', label: 'FLAT AMOUNT' },
                  { value: 'YOPO_LOGIC', label: 'YOPO LOGIC' },
                  { value: 'FREE_ITEM', label: 'FREE ITEM' },
                  { value: 'COMBO_PRICE', label: 'COMBO PRICE' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Discount Value"
                type="number"
                value={formData.discountValue?.toString() || '0'}
                onChange={(value) => setFormData({ ...formData, discountValue: parseFloat(value) || 0 })}
              />
              <Input
                label="Priority"
                type="number"
                value={formData.priority?.toString() || '100'}
                onChange={(value) => setFormData({ ...formData, priority: parseInt(value) || 100 })}
                hint="Lower number = higher priority"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Frame Brand"
                value={formData.frameBrand || ''}
                onChange={(value) => {
                  const brand = value || null;
                  setFormData({ 
                    ...formData, 
                    frameBrand: brand,
                    frameSubCategory: brand ? formData.frameSubCategory : null
                  });
                }}
                options={[
                  { value: '', label: 'Any Brand' },
                  ...brands.map(b => ({ value: b, label: b }))
                ]}
              />
              <Select
                label="Frame Sub-Brand"
                value={formData.frameSubCategory || ''}
                onChange={(value) => setFormData({ ...formData, frameSubCategory: value || null })}
                options={[
                  { value: '', label: 'Any Sub-Brand' },
                  ...availableSubBrands.map(sb => ({ value: sb, label: sb }))
                ]}
                disabled={!formData.frameBrand}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Frame MRP (₹)"
                type="number"
                value={formData.minFrameMRP?.toString() || ''}
                onChange={(value) => setFormData({ ...formData, minFrameMRP: value ? parseFloat(value) : null })}
                placeholder="Optional"
              />
              <Input
                label="Max Frame MRP (₹)"
                type="number"
                value={formData.maxFrameMRP?.toString() || ''}
                onChange={(value) => setFormData({ ...formData, maxFrameMRP: value ? parseFloat(value) : null })}
                placeholder="Optional"
              />
            </div>

            {formData.discountType === 'COMBO_PRICE' && (
              <Input
                label="Combo Price (₹)"
                type="number"
                value={formData.comboPrice?.toString() || ''}
                onChange={(value) => setFormData({ ...formData, comboPrice: value ? parseFloat(value) : null })}
                placeholder="e.g., 3999"
              />
            )}

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isSecondPairRule || false}
                  onChange={(e) => setFormData({ ...formData, isSecondPairRule: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Second Pair Rule
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Active
                </label>
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Offer Rule"
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
          <p className="text-zinc-600 dark:text-zinc-400">
            Are you sure you want to delete offer rule <strong className="text-zinc-900 dark:text-zinc-50">"{deleteConfirm?.name}"</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

