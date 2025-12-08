import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { featureService } from '../../services/features';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const FeatureCategory = {
  DURABILITY: 'DURABILITY',
  COATING: 'COATING',
  PROTECTION: 'PROTECTION',
  LIFESTYLE: 'LIFESTYLE',
  VISION: 'VISION'
};

export default function FeaturesPage() {
  const { showToast } = useToast();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'LIFESTYLE',
    displayOrder: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/features', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        const featuresList = data.data?.features || [];
        // Filter to show F01-F11 first, then others
        const f01to11 = featuresList.filter(f => /^F\d{2}$/.test(f.code) && parseInt(f.code.substring(1)) >= 1 && parseInt(f.code.substring(1)) <= 11);
        const others = featuresList.filter(f => !/^F\d{2}$/.test(f.code) || parseInt(f.code.substring(1)) > 11);
        setFeatures([...f01to11.sort((a, b) => parseInt(a.code.substring(1)) - parseInt(b.code.substring(1))), ...others]);
      } else {
        showToast('error', data.error?.message || 'Failed to load features');
      }
    } catch (error) {
      console.error('Failed to load features:', error);
      showToast('error', 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'LIFESTYLE',
      displayOrder: 0,
    });
    setEditingFeature(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (feature) => {
    // F01-F11: Only allow editing name/description/category, not code
    const isCoreFeature = /^F\d{2}$/.test(feature.code) && parseInt(feature.code.substring(1)) >= 1 && parseInt(feature.code.substring(1)) <= 11;
    setFormData({
      code: feature.code || feature.key || '',
      name: feature.name,
      description: feature.description || '',
      category: feature.category || 'LIFESTYLE',
      displayOrder: feature.displayOrder || 0,
    });
    setEditingFeature(feature);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingFeature) {
        await featureService.update(editingFeature.id, formData);
        showToast('success', 'Feature updated successfully');
      } else {
        await featureService.create(formData);
        showToast('success', 'Feature created successfully');
      }
      setIsCreateOpen(false);
      fetchFeatures();
    } catch (error) {
      showToast('error', error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await featureService.delete(deleteConfirm.id);
      showToast('success', 'Feature deactivated successfully');
      setDeleteConfirm(null);
      fetchFeatures();
    } catch (error) {
      showToast('error', error.message || 'Failed to delete feature');
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'DURABILITY':
        return 'blue';
      case 'COATING':
        return 'purple';
      case 'PROTECTION':
        return 'green';
      case 'LIFESTYLE':
        return 'orange';
      case 'VISION':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Feature Code',
      render: (feature) => (
        <span className="font-mono text-sm text-black font-semibold">{feature.code || feature.key || 'N/A'}</span>
      ),
    },
    {
      key: 'name',
      header: 'Feature Name',
      render: (feature) => (
        <p className="font-medium text-black">{feature.name}</p>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (feature) => (
        <span className="text-sm text-black">{feature.description || '-'}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (feature) => (
        <Badge color={getCategoryBadgeColor(feature.category)}>
          {feature.category ? feature.category.replace('_', ' ') : '-'}
        </Badge>
      ),
    },
    {
      key: 'productCount',
      header: 'Products',
      render: (feature) => (
        <span className="text-sm text-black">{feature.productCount || 0}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (feature) => (
        <Badge color={feature.isActive ? 'green' : 'red'}>
          {feature.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'DURABILITY', label: 'Durability' },
    { value: 'COATING', label: 'Coating' },
    { value: 'PROTECTION', label: 'Protection' },
    { value: 'LIFESTYLE', label: 'Lifestyle' },
    { value: 'VISION', label: 'Vision' },
  ];

  return (
    <AdminLayout title="Features">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-black">Lens Features (F01-F11)</h1>
            <p className="text-sm text-black mt-1">Manage fixed feature list for lens products. Core features F01-F11 cannot be deleted.</p>
          </div>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className="w-full sm:w-auto shrink-0" disabled>
            Add Feature (F12+)
          </Button>
        </div>


        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {features.length === 0 && !loading ? (
            <EmptyState
              icon={<Sparkles size={80} className="text-gray-400" />}
              title="No features found"
              description="Create features to describe product characteristics"
              action={{
                label: 'Add Feature',
                onClick: handleCreate,
              }}
            />
          ) : (
            <DataTable
              columns={columns}
              data={features}
              loading={loading}
              rowActions={(feature) => {
                const isCoreFeature = /^F\d{2}$/.test(feature.code) && parseInt(feature.code.substring(1)) >= 1 && parseInt(feature.code.substring(1)) <= 11;
                return (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleEdit(feature)}
                    >
                      Edit
                    </Button>
                    {!isCoreFeature && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 size={14} />}
                        onClick={() => setDeleteConfirm(feature)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                );
              }}
            />
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingFeature ? 'Edit Feature' : 'Create Feature'}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={submitting} className="rounded-full">
                {editingFeature ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Feature Code"
              placeholder="F01, F02, ... F12+"
              value={formData.code}
              onChange={(value) => setFormData({ ...formData, code: value.toUpperCase() })}
              required
              disabled={editingFeature && /^F\d{2}$/.test(editingFeature.code) && parseInt(editingFeature.code.substring(1)) >= 1 && parseInt(editingFeature.code.substring(1)) <= 11}
              hint={editingFeature && /^F\d{2}$/.test(editingFeature.code) && parseInt(editingFeature.code.substring(1)) >= 1 && parseInt(editingFeature.code.substring(1)) <= 11 ? "Core features F01-F11 cannot have their codes changed" : "Feature code (e.g., F01, F02, F12)"}
            />

            <Input
              label="Feature Name"
              placeholder="Blue Light Filter"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />

            <Input
              label="Description"
              placeholder="Blocks harmful blue light from screens"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              multiline
              rows={2}
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              options={categoryOptions.filter(opt => opt.value)}
              required
            />
            <Input
              label="Display Order"
              type="number"
              value={formData.displayOrder?.toString() || '0'}
              onChange={(value) => setFormData({ ...formData, displayOrder: parseInt(value) || 0 })}
              hint="Order in which features appear (lower = first)"
            />
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Deactivate Feature"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-full">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} className="rounded-full">
                Deactivate
              </Button>
            </>
          }
        >
          <p className="text-zinc-600 dark:text-zinc-400">
            Are you sure you want to deactivate <strong className="text-zinc-900 dark:text-zinc-50">{deleteConfirm?.name}</strong>?
            This will not affect existing product associations.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

