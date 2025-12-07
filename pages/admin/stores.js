import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { storeService } from '../../services/stores';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstNumber: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchStores();
  }, [statusFilter]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = {};
      // Only filter by status if explicitly set to 'active' or 'inactive'
      // Default behavior: show all active stores (handled by backend)
      if (statusFilter === 'active') {
        params.isActive = 'true';
      } else if (statusFilter === 'inactive') {
        params.isActive = 'false';
      }
      // If statusFilter is 'all', don't pass isActive param - backend will show active by default
      if (search) {
        params.search = search;
      }
      console.log('Fetching stores with params:', params);
      const data = await storeService.list(params);
      console.log('storeService.list returned:', data);
      // Handle different response formats
      const storesList = Array.isArray(data) ? data : (data?.stores || []);
      console.log('Final stores list:', storesList.length, storesList);
      setStores(storesList);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      showToast('error', 'Failed to load stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    // Debounce search
    setTimeout(() => {
      fetchStores();
    }, 300);
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      gstNumber: '',
      isActive: true,
    });
    setFormErrors({});
    setEditingStore(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (store) => {
    setFormData({
      code: store.code,
      name: store.name,
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      pincode: store.pincode || '',
      phone: store.phone || '',
      email: store.email || '',
      gstNumber: store.gstNumber || '',
      isActive: store.isActive !== false,
    });
    setFormErrors({});
    setEditingStore(store);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      let result;
      if (editingStore) {
        result = await storeService.update(editingStore.id || editingStore._id, formData);
        showToast('success', 'Store updated successfully');
      } else {
        result = await storeService.create(formData);
        showToast('success', 'Store created successfully');
      }
      setIsCreateOpen(false);
      setEditingStore(null);
      // Refresh store list
      await fetchStores();
      // Trigger dashboard refresh in other tabs/windows
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('dashboard-refresh', Date.now().toString());
      }
    } catch (error) {
      console.error('Store save error:', error);
      if (error.code === 'RESOURCE_CONFLICT') {
        setFormErrors({ code: 'A store with this code already exists' });
      } else if (error.code === 'VALIDATION_ERROR' && error.details) {
        setFormErrors(error.details);
      } else {
        showToast('error', error.message || 'Failed to save store');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await storeService.delete(deleteConfirm.id || deleteConfirm._id);
      showToast('success', 'Store deleted successfully');
      setDeleteConfirm(null);
      // Refresh store list after deletion
      await fetchStores();
      // Trigger dashboard refresh in other tabs/windows
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('dashboard-refresh', Date.now().toString());
      }
    } catch (error) {
      console.error('Delete store error:', error);
      showToast('error', error.message || 'Failed to delete store');
    }
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'city', header: 'City' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'qrCodeUrl',
      header: 'QR Code',
      render: (item) => (
        item.qrCodeUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={item.qrCodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
              title="View QR Code URL"
            >
              View QR
            </a>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Not generated</span>
        )
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <Badge color={item.isActive ? 'green' : 'gray'} variant="soft">
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Store Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Stores</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your store locations and settings</p>
          </div>
          <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
            Add Store
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name, code, or city..."
              value={search}
              onChange={handleSearch}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <DataTable
            columns={columns}
            data={stores}
            loading={loading}
            emptyMessage="No stores found"
            rowActions={(item) => (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="text-primary hover:text-primary-hover"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(item);
                  }}
                  className="text-danger hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingStore ? 'Edit Store' : 'Create Store'}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingStore ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Store Code"
                value={formData.code}
                onChange={(value) => setFormData({ ...formData, code: value })}
                required
                error={formErrors.code}
              />
              <Input
                label="Store Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                error={formErrors.name}
              />
            </div>
            <Input
              label="Address"
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              error={formErrors.address}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                error={formErrors.city}
              />
              <Input
                label="State"
                value={formData.state}
                onChange={(value) => setFormData({ ...formData, state: value })}
                error={formErrors.state}
              />
              <Input
                label="Pincode"
                value={formData.pincode}
                onChange={(value) => setFormData({ ...formData, pincode: value })}
                error={formErrors.pincode}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                error={formErrors.phone}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                error={formErrors.email}
              />
            </div>
            <Input
              label="GST Number"
              value={formData.gstNumber}
              onChange={(value) => setFormData({ ...formData, gstNumber: value })}
              error={formErrors.gstNumber}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Store"
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
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

