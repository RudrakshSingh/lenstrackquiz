import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { lensProductService } from '../../services/lensProducts';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';

export default function LensList() {
  const router = useRouter();
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visionTypeFilter, setVisionTypeFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadLenses();
  }, [visionTypeFilter]);

  const loadLenses = async () => {
    try {
      setLoading(true);
      const params = visionTypeFilter !== 'all' ? { visionType: visionTypeFilter } : {};
      const data = await lensProductService.list(params);
      console.log('Loaded lenses from service:', data); // Debug log
      if (Array.isArray(data)) {
        setLenses(data);
      } else {
        console.warn('Expected array but got:', typeof data, data);
        setLenses([]);
      }
    } catch (err) {
      console.error('Error loading lenses:', err); // Debug log
      showToast('error', err.message || 'Failed to load lenses');
      setLenses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await lensProductService.delete(deleteConfirm.id);
      showToast('success', 'Lens deleted successfully');
      setDeleteConfirm(null);
      loadLenses();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete lens');
    }
  };

  const filteredLenses = lenses.filter(lens => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      lens.name?.toLowerCase().includes(searchLower) ||
      lens.itCode?.toLowerCase().includes(searchLower) ||
      lens.brandLine?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    { key: 'itCode', header: 'IT Code' },
    { key: 'name', header: 'Name' },
    {
      key: 'brandLine',
      header: 'Brand Line',
      render: (item) => (
        <Badge color="blue" variant="soft">
          {item.brandLine?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'visionType',
      header: 'Vision Type',
      render: (item) => (
        <Badge color="green" variant="soft">
          {item.visionType?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'lensIndex',
      header: 'Index',
      render: (item) => item.lensIndex?.replace('INDEX_', ''),
    },
    {
      key: 'mrp',
      header: 'MRP',
      render: (item) => `₹${item.mrp || 0}`,
    },
    {
      key: 'offerPrice',
      header: 'Offer Price',
      render: (item) => `₹${item.offerPrice || 0}`,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <Badge color={item.isActive !== false ? 'green' : 'gray'} variant="soft">
          {item.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Lens Product Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Lens Products</h2>
            <p className="text-sm text-gray-500 mt-1">Manage lens products and specifications</p>
          </div>
          <Button 
            onClick={() => router.push('/admin/lens-entry')} 
            icon={<Plus className="h-4 w-4" />}
            variant="primary"
            size="md"
            className="hover-lift"
          >
            Add New Lens
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search lenses by name, IT Code, or brand line..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={visionTypeFilter}
            onChange={(e) => setVisionTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="all">All Vision Types</option>
            <option value="SINGLE_VISION">Single Vision</option>
            <option value="PROGRESSIVE">Progressive</option>
            <option value="BIFOCAL">Bifocal</option>
            <option value="ANTI_FATIGUE">Anti-Fatigue</option>
            <option value="MYOPIA_CONTROL">Myopia Control</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <DataTable
              columns={columns}
              data={filteredLenses}
              loading={loading}
              emptyMessage="No lenses found. Click 'Add New Lens' to create one."
              rowActions={(item) => (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/lens-entry?id=${item.id}`);
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
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Lens Product"
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
            Are you sure you want to delete lens product "{deleteConfirm?.name}"? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}
