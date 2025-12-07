import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api-client';
import { Search, Eye, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerList() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: '',
    dateRange: 'all',
    selectedLens: 'all',
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersResponse, lensesData] = await Promise.all([
        api.get('/admin/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/admin/lenses').catch(() => ({ lenses: [] })),
      ]);

      const customersData = customersResponse?.data || customersResponse;
      setCustomers(Array.isArray(customersData?.customers) ? customersData.customers : Array.isArray(customersData) ? customersData : []);
      setLenses(Array.isArray(lensesData) ? lensesData : lensesData?.lenses || []);
    } catch (err) {
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getLensName = (lensId) => {
    if (!lensId) return 'Not selected';
    const lens = lenses.find(l => 
      l._id === lensId || 
      l.id === lensId || 
      l.name?.toLowerCase().replace(/\s+/g, '-') === lensId.toLowerCase()
    );
    return lens ? lens.name : lensId;
  };

  const getRecommendedLens = (customer) => {
    if (customer.selectedLensId) {
      return getLensName(customer.selectedLensId);
    }
    if (customer.recommendation?.perfectMatch?.name) {
      return customer.recommendation.perfectMatch.name;
    }
    return 'No recommendation';
  };

  const filteredCustomers = customers.filter(customer => {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.number?.includes(filter.search) ||
        customer.email?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filter.selectedLens !== 'all') {
      const recommendedLens = getRecommendedLens(customer);
      if (recommendedLens !== filter.selectedLens) return false;
    }

    if (filter.dateRange !== 'all') {
      const customerDate = new Date(customer.createdAt);
      const now = new Date();
      const daysDiff = (now - customerDate) / (1000 * 60 * 60 * 24);
      
      if (filter.dateRange === 'today' && daysDiff > 1) return false;
      if (filter.dateRange === 'week' && daysDiff > 7) return false;
      if (filter.dateRange === 'month' && daysDiff > 30) return false;
    }

    return true;
  });

  const columns = [
    { key: 'name', header: 'Customer' },
    {
      key: 'contact',
      header: 'Contact',
      render: (item) => (
        <div>
          <div>{item.number || 'N/A'}</div>
          {item.email && (
            <div className="text-sm text-gray-500">{item.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'store',
      header: 'Store',
      render: (item) => (
        <Badge color="blue" variant="soft">
          {item.storeName || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'salesperson',
      header: 'Salesperson',
      render: (item) => (
        <span className="text-sm text-gray-700">{item.salespersonName || 'N/A'}</span>
      ),
    },
    {
      key: 'prescription',
      header: 'Prescription',
      render: (item) => (
        <div className="text-sm">
          {item.power?.right?.sph && (
            <div>
              <strong>R:</strong> {item.power.right.sph}
              {item.power.right.cyl && ` / ${item.power.right.cyl}`}
            </div>
          )}
          {item.power?.left?.sph && (
            <div>
              <strong>L:</strong> {item.power.left.sph}
              {item.power.left.cyl && ` / ${item.power.left.cyl}`}
            </div>
          )}
          {item.add && <div><strong>ADD:</strong> {item.add}</div>}
        </div>
      ),
    },
    {
      key: 'frameType',
      header: 'Frame Type',
      render: (item) => (
        <Badge color="blue" variant="soft" size="sm">
          {item.frameType?.replace(/_/g, ' ') || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'recommendedLens',
      header: 'Recommended Lens',
      render: (item) => {
        const recommended = getRecommendedLens(item);
        return (
          <Badge color="green" variant="soft" size="sm">
            {recommended}
          </Badge>
        );
      },
    },
    {
      key: 'selectedLens',
      header: 'Selected Lens',
      render: (item) => {
        const selected = item.selectedLensId ? getLensName(item.selectedLensId) : 'Not selected';
        return item.selectedLensId ? (
          <Badge color="purple" variant="soft" size="sm">
            {selected}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">Not selected</span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (item) => format(new Date(item.createdAt || new Date()), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/customers/${item._id || item.submissionId}`)}
          icon={<Eye className="h-4 w-4" />}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout title="Customer Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
            <p className="text-sm text-gray-500 mt-1">View customer data and lens recommendations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex items-center border-l-4 border-primary hover-lift animate-fade-in">
            <div className="p-3 bg-primary-light rounded-lg mr-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{customers.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex items-center border-l-4 border-success hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="p-3 bg-green-100 rounded-lg mr-4 transition-transform duration-300 hover:scale-110">
              <Users className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Lens Selected</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {customers.filter(c => c.selectedLensId).length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex items-center border-l-4 border-info hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Users className="h-8 w-8 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">With Recommendations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {customers.filter(c => c.recommendation?.perfectMatch).length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <Select
            value={filter.dateRange}
            onChange={(value) => setFilter({ ...filter, dateRange: value })}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
            ]}
          />
          <Select
            value={filter.selectedLens}
            onChange={(value) => setFilter({ ...filter, selectedLens: value })}
            options={[
              { value: 'all', label: 'All Lenses' },
              ...lenses.map(lens => ({ value: lens.name, label: lens.name })),
            ]}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <DataTable
              columns={columns}
              data={filteredCustomers}
              loading={loading}
              emptyMessage="No customers found. Customers will appear here once they complete the questionnaire."
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
