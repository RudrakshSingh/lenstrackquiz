import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { lensProductService } from '../../services/lensProducts';
import { Plus, Edit2, Copy, ToggleLeft, ToggleRight, Search, Package } from 'lucide-react';

export default function AdminLensesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [lenses, setLenses] = useState([]);
  const [lensBrands, setLensBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.organizationId) {
      fetchLensBrands();
      fetchLenses();
    }
  }, [user]);

  const fetchLensBrands = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/lens-brands', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setLensBrands(data.data?.brands || []);
      }
    } catch (error) {
      console.error('Failed to load lens brands:', error);
    }
  };

  useEffect(() => {
    if (user?.organizationId && search !== null) {
      const delayDebounceFn = setTimeout(() => {
        fetchLenses();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, user]);

  const fetchLenses = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      // Use new lens products API (V2 Architecture)
      const response = await fetch(`/api/admin/products/lenses?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      
      if (data.success) {
        const productsArray = data.data?.products || [];
        
        // Create brand map for lookup
        const brandMap = {};
        lensBrands.forEach(b => {
          brandMap[b.id] = b.name;
        });
        
        const mappedLenses = productsArray.map(p => ({
          id: p.id || p._id?.toString(),
          itCode: p.itCode || 'N/A',
          lensBrandId: p.lensBrandId,
          lensBrandName: p.lensBrandName || brandMap[p.lensBrandId] || p.brandLine || 'N/A',
          type: p.type || p.visionType || null,
          index: p.index || p.lensIndex || null,
          offerPrice: p.offerPrice || 0,
          mrp: p.mrp || 0,
          isActive: p.isActive !== false,
          // Legacy support
          brandLine: p.brandLine,
          visionType: p.visionType,
          lensIndex: p.lensIndex,
        }));
        setLenses(mappedLenses);
      }
    } catch (error) {
      console.error('Failed to load lenses:', error);
      showToast('error', 'Failed to load lenses');
      setLenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (lens) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      if (!token) {
        showToast('error', 'Please login again');
        return;
      }

      const response = await fetch(`/api/admin/products/lenses/${lens.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !lens.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', `Lens ${!lens.isActive ? 'activated' : 'deactivated'}`);
        fetchLenses();
      } else {
        showToast('error', data.error?.message || 'Failed to update lens');
      }
    } catch (error) {
      showToast('error', 'Failed to update lens');
    }
  };

  const handleClone = async (lens) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      if (!token) {
        showToast('error', 'Please login again');
        return;
      }

      // Fetch full product details
      const productResponse = await fetch(`/api/admin/products/${lens.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productData = await productResponse.json();
      
      if (!productData.success) {
        showToast('error', 'Failed to fetch lens details');
        return;
      }

      const product = productData.data;
      
      // Create cloned product with modified SKU
      const clonedSku = `${product.sku || product.itCode}-COPY-${Date.now()}`;
      const cloneResponse = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sku: clonedSku,
          itCode: product.itCode || clonedSku,
          name: `${product.name} (Copy)`,
          brand: product.brand,
          brandLine: product.brandLine,
          subCategory: product.subCategory || product.index,
          basePrice: product.basePrice || product.offerPrice || 0,
          mrp: product.mrp || product.basePrice || product.offerPrice || 0,
          category: product.category || 'EYEGLASSES',
          description: product.description || '',
          imageUrl: product.imageUrl || '',
          isActive: true, // Set cloned lens as active
          yopoEligible: product.yopoEligible || false,
          features: (product.features || []).map(f => ({
            featureId: f.featureId || f.feature?.id,
            strength: f.strength || 1,
          })),
        }),
      });

      const cloneData = await cloneResponse.json();
      if (cloneData.success) {
        showToast('success', 'Lens cloned successfully');
        fetchLenses();
      } else {
        showToast('error', cloneData.error?.message || 'Failed to clone lens');
      }
    } catch (error) {
      console.error('Clone error:', error);
      showToast('error', 'Failed to clone lens');
    }
  };

  const columns = [
    {
      key: 'itCode',
      header: 'IT Code',
      render: (lens) => (
        <span className="font-mono text-sm font-medium text-black">
          {lens.itCode}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (lens) => (
        <span className="font-medium text-black">{lens.name}</span>
      ),
    },
    {
      key: 'lensBrandName',
      header: 'Lens Brand',
      render: (lens) => (
        <span className="text-sm text-black">
          {lens.lensBrandName || 'N/A'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (lens) => (
        <span className="text-sm text-black">
          {lens.type || 'N/A'}
        </span>
      ),
    },
    {
      key: 'index',
      header: 'Index',
      render: (lens) => (
        <span className="text-sm text-black">
          {lens.index || 'N/A'}
        </span>
      ),
    },
    {
      key: 'offerPrice',
      header: 'Offer Price',
      render: (lens) => (
        <span className="font-medium text-black">
          ₹{lens.offerPrice.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Active',
      render: (lens) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(lens);
          }}
          className="flex items-center gap-2 hover:scale-110 transition-transform duration-200"
          title={lens.isActive ? 'Click to deactivate' : 'Click to activate'}
        >
          {lens.isActive ? (
            <ToggleRight className="text-green-600 dark:text-green-400" size={24} />
          ) : (
            <ToggleLeft className="text-zinc-400 dark:text-zinc-600" size={24} />
          )}
        </button>
      ),
    },
  ];

  const filteredLenses = lenses;

  return (
    <AdminLayout title="Lens Products">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-black">Lens Products</h1>
            <p className="text-sm text-black mt-1">Manage your lens catalog and product information</p>
          </div>
          <Button 
            onClick={() => router.push('/admin/lens-detail?id=new')} 
            icon={<Plus size={18} />}
            variant="primary"
            className="w-full sm:w-auto shrink-0"
          >
            New Lens
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 dark:text-zinc-500" 
              size={20} 
            />
            <input
              type="text"
              placeholder="Search by IT Code, Name, Brand Line..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLenses.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Package size={80} className="text-gray-300 dark:text-black" />}
                title="No Lenses"
                description="Start by adding a new lens"
                action={{
                  label: 'New Lens',
                  onClick: () => router.push('/admin/lens-detail?id=new'),
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLenses}
              loading={loading}
              emptyMessage="No lenses found. Click 'New Lens' to create one."
              rowActions={(lens) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/lens-detail?id=${lens.id}`);
                    }}
                    icon={<Edit2 size={14} />}
                    className="rounded-full"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClone(lens);
                    }}
                    icon={<Copy size={14} />}
                    className="rounded-full"
                  >
                    Clone
                  </Button>
                </div>
              )}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
