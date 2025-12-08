import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { offerService } from '../../services/offers';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit, Trash2, Search, Tag, Filter } from 'lucide-react';

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
    { 
      key: 'name', 
      header: 'NAME',
      render: (item) => (
        <span className="font-medium text-black">{item.name || 'N/A'}</span>
      ),
    },
    {
      key: 'offerType',
      header: 'TYPE',
      render: (item) => (
        <Badge color="gray" variant="soft">
          {item.offerType?.replace(/_/g, ' ') || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'filters',
      header: 'TARGET FILTERS',
      render: (item) => {
        const filters = [];
        if (item.frameBrand) {
          filters.push(`Frame: ${item.frameBrand}`);
        }
        if (item.minFrameMRP) {
          filters.push(`Min MRP: ₹${item.minFrameMRP}`);
        }
        if (item.lensBrandLines?.length > 0) {
          filters.push(`Lens: ${item.lensBrandLines.join(', ')}`);
        }
        if (filters.length === 0) {
          return <span className="text-sm text-black">No filters</span>;
        }
        return (
          <div className="text-sm text-black space-y-1">
            {filters.map((filter, idx) => (
              <div key={idx}>{filter}</div>
            ))}
          </div>
        );
      },
    },
    { 
      key: 'priority', 
      header: 'PRIORITY',
      render: (item) => (
        <span className="font-medium text-black">{item.priority || '0'}</span>
      ),
    },
    {
      key: 'validity',
      header: 'VALIDITY',
      render: (item) => {
        const startDate = formatDate(item.startDate);
        const endDate = formatDate(item.endDate);
        return (
          <div className="text-sm text-black">
            {startDate} - {endDate}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'STATUS',
      render: (item) => (
        <Badge color={item.isActive ? 'green' : 'gray'} variant="soft">
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // Filter offers based on search
  const filteredOffers = offers.filter(offer => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      offer.name?.toLowerCase().includes(searchLower) ||
      offer.offerType?.toLowerCase().includes(searchLower) ||
      offer.code?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout title="Offer Management">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-black">Promotions</h1>
            <p className="text-sm text-black mt-1">Manage promotional offers and discount rules</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => router.push('/admin/offer-mapping')} 
              variant="outline"
              className="w-full sm:w-auto shrink-0"
            >
              View Mapping
            </Button>
            <Button 
              onClick={() => router.push('/admin/offer-entry')} 
              icon={<Plus className="h-4 w-4" />}
              variant="primary"
              className="w-full sm:w-auto shrink-0"
            >
              Create Promotion
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4 border border-gray-200">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 dark:text-black" />
            <select
              value={filter.isActive}
              onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
              className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all"
            >
              <option value="all">All Offers</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredOffers}
            loading={loading}
            emptyMessage="No offers found. Create your first offer to get started!"
            rowActions={(item) => (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/offer-entry?id=${item._id || item.id}`);
                  }}
                  className="p-2 text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(item);
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
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
          <p className="text-black dark:text-gray-300">
            Are you sure you want to delete offer <strong className="text-black dark:text-white">"{deleteConfirm?.name}"</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}
