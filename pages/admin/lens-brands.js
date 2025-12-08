import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Search, Network } from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function LensBrandsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user?.organizationId) {
      fetchBrands();
    }
  }, [user]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/lens-brands', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        setBrands(data.data?.brands || []);
      } else {
        showToast('error', data.error?.message || 'Failed to load lens brands');
      }
    } catch (error) {
      console.error('Failed to load lens brands:', error);
      showToast('error', 'Failed to load lens brands');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ name: '', description: '', isActive: true });
    setFormErrors({});
    setEditingBrand(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (brand) => {
    setFormData({
      name: brand.name,
      description: brand.description || '',
      isActive: brand.isActive !== false
    });
    setFormErrors({});
    setEditingBrand(brand);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!formData.name || !formData.name.trim()) {
      setFormErrors({ name: 'Lens brand name is required' });
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const url = editingBrand 
        ? `/api/admin/lens-brands/${editingBrand.id}`
        : '/api/admin/lens-brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', editingBrand ? 'Lens brand updated successfully' : 'Lens brand created successfully');
        setIsCreateOpen(false);
        fetchBrands();
      } else {
        showToast('error', data.error?.message || 'Failed to save lens brand');
      }
    } catch (error) {
      console.error('Failed to save lens brand:', error);
      showToast('error', 'Failed to save lens brand');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/lens-brands/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Lens brand deleted successfully');
        setDeleteConfirm(null);
        fetchBrands();
      } else {
        showToast('error', data.error?.message || 'Failed to delete lens brand');
      }
    } catch (error) {
      console.error('Failed to delete lens brand:', error);
      showToast('error', 'Failed to delete lens brand');
    }
  };

  const filteredBrands = brands.filter(brand => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      brand.name.toLowerCase().includes(searchLower) ||
      (brand.description && brand.description.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      key: 'name',
      label: 'Brand Name',
      render: (brand) => (
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-black">{brand.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (brand) => (
        <span className="text-black">{brand.description || '-'}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (brand) => (
        <Badge color={brand.isActive ? 'green' : 'gray'} size="sm">
          {brand.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (brand) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(brand)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirm(brand)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black">Lens Brands</h1>
            <p className="text-sm text-black mt-1">
              Manage lens brand lines (e.g., DIGI360, DriveXpert, BlueXpert)
            </p>
          </div>
          <Button onClick={handleCreate} icon={<Plus size={16} />}>
            Add Lens Brand
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black" />
            <input
              type="text"
              placeholder="Search lens brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : filteredBrands.length === 0 ? (
          <EmptyState
            icon={<Network size={48} />}
            title="No lens brands found"
            description={search ? 'Try adjusting your search' : 'Create your first lens brand to get started'}
            action={!search && (
              <Button onClick={handleCreate} icon={<Plus size={16} />}>
                Add Lens Brand
              </Button>
            )}
          />
        ) : (
          <DataTable columns={columns} data={filteredBrands} />
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingBrand ? 'Edit Lens Brand' : 'Add Lens Brand'}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingBrand ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Brand Name *"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., DIGI360, DriveXpert, BlueXpert"
              required
              error={formErrors.name}
            />
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this lens brand line"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-black">
                Active (Available for use)
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Lens Brand"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-black">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? 
            This action cannot be undone. If this brand is used by any lens products, deletion will be prevented.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

