import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { offerService } from '../../services/offers';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ isActive: 'all' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = filter.isActive !== 'all' ? { isActive: filter.isActive === 'true' } : {};
      const data = await offerService.listRules(params);
      setOffers(data || []);
    } catch (error) {
      showToast('error', 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await offerService.deleteRule(deleteConfirm.id);
      showToast('success', 'Offer deleted successfully');
      setDeleteConfirm(null);
      fetchOffers();
    } catch (error) {
      showToast('error', error.message || 'Failed to delete offer');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const columns = [
    { key: 'name', header: 'Name' },
    {
      key: 'offerType',
      header: 'Type',
      render: (item) => (
        <Badge color="blue" variant="soft">
          {item.offerType?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'filters',
      header: 'Target Filters',
      render: (item) => (
        <div className="text-sm text-gray-600">
          {item.lensBrandLines?.length > 0 && (
            <div>Brands: {item.lensBrandLines.join(', ')}</div>
          )}
          {item.frameBrand && <div>Frame: {item.frameBrand}</div>}
          {item.minFrameMRP && <div>Min MRP: ₹{item.minFrameMRP}</div>}
        </div>
      ),
    },
    { key: 'priority', header: 'Priority' },
    {
      key: 'validity',
      header: 'Validity',
      render: (item) => (
        <div className="text-sm">
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </div>
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
    <AdminLayout title="Offer Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Offers</h2>
            <p className="text-sm text-gray-500 mt-1">Manage offer rules and discounts</p>
          </div>
          <Button onClick={() => router.push('/admin/offer-entry')} icon={<Plus className="h-4 w-4" />}>
            Add Offer
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search offers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={filter.isActive}
            onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="all">All Offers</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <DataTable
            columns={columns}
            data={offers}
            loading={loading}
            emptyMessage="No offers found"
            rowActions={(item) => (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/offer-entry?id=${item.id}`);
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

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Offer"
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
            Are you sure you want to delete offer "{deleteConfirm?.name}"? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}
