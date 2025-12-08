import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Search, Package, Frame, Sun, Eye, ShoppingCart } from 'lucide-react';

const PRODUCT_TYPES = [
  { value: 'FRAME', label: 'Frames', icon: Frame },
  { value: 'SUNGLASS', label: 'Sunglasses', icon: Sun },
  { value: 'CONTACT_LENS', label: 'Contact Lenses', icon: Eye },
  { value: 'ACCESSORY', label: 'Accessories', icon: ShoppingCart }
];

export default function ProductsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('FRAME');
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subBrands, setSubBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    type: 'FRAME',
    brandId: '',
    subBrandId: '',
    name: '',
    sku: '',
    mrp: '',
    hsnCode: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user?.organizationId) {
      fetchProducts();
      fetchBrands();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (formData.brandId) {
      fetchSubBrands(formData.brandId);
    } else {
      setSubBrands([]);
      setFormData(prev => ({ ...prev, subBrandId: '' }));
    }
  }, [formData.brandId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/retail-products?type=${activeTab}&organizationId=${user.organizationId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();
      if (data.success) {
        setProducts(Array.isArray(data.data?.products) ? data.data.products : []);
      } else {
        showToast('error', data.error?.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      showToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/brands?isActive=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();
      if (data.success) {
        setBrands(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const fetchSubBrands = async (brandId) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/brands/${brandId}/subbrands`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();
      if (data.success) {
        setSubBrands(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to load sub-brands:', error);
    }
  };

  const handleTabChange = (type) => {
    setActiveTab(type);
    setSearch('');
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      type: activeTab,
      brandId: '',
      subBrandId: '',
      name: '',
      sku: '',
      mrp: '',
      hsnCode: '',
      isActive: true
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      type: product.type,
      brandId: product.brandId,
      subBrandId: product.subBrandId || '',
      name: product.name || '',
      sku: product.sku || '',
      mrp: product.mrp?.toString() || '',
      hsnCode: product.hsnCode || '',
      isActive: product.isActive !== undefined ? product.isActive : true
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors = {};
    if (!formData.brandId) errors.brandId = 'Brand is required';
    if (!formData.mrp || isNaN(parseFloat(formData.mrp)) || parseFloat(formData.mrp) < 0) {
      errors.mrp = 'Valid MRP is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const url = editingProduct 
        ? `/api/admin/retail-products/${editingProduct.id}`
        : '/api/admin/retail-products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      const payload = {
        type: formData.type,
        brandId: formData.brandId,
        subBrandId: formData.subBrandId || null,
        name: formData.name || null,
        sku: formData.sku || null,
        mrp: parseFloat(formData.mrp),
        hsnCode: formData.hsnCode || null,
        isActive: formData.isActive
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setIsCreateOpen(false);
        fetchProducts();
      } else {
        showToast('error', data.error?.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      showToast('error', 'Failed to save product');
    }
  };

  const handleDelete = async (productId) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/retail-products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Product deleted successfully');
        setDeleteConfirm(null);
        fetchProducts();
      } else {
        showToast('error', data.error?.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      showToast('error', 'Failed to delete product');
    }
  };

  const getProductTypeLabel = (type) => {
    const productType = PRODUCT_TYPES.find(pt => pt.value === type);
    return productType ? productType.label : type;
  };

  const getAddButtonLabel = () => {
    const productType = PRODUCT_TYPES.find(pt => pt.value === activeTab);
    return `Add ${productType ? productType.label.slice(0, -1) : 'Product'}`;
  };

  const filteredProducts = products.filter(product => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchLower)) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.brandName && product.brandName.toLowerCase().includes(searchLower)) ||
      (product.subBrandName && product.subBrandName.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (product) => (
        <div>
          <div className="font-medium text-black">{product.name || 'N/A'}</div>
          {product.sku && <div className="text-sm text-gray-500">{product.sku}</div>}
        </div>
      )
    },
    {
      key: 'brand',
      label: 'Brand / Sub-Brand',
      render: (product) => (
        <div>
          <div className="font-medium text-black">{product.brandName || 'N/A'}</div>
          {product.subBrandName && <div className="text-sm text-gray-500">{product.subBrandName}</div>}
        </div>
      )
    },
    {
      key: 'mrp',
      label: 'MRP',
      render: (product) => <span className="text-black">₹{product.mrp?.toLocaleString() || '0'}</span>
    },
    {
      key: 'type',
      label: 'Type',
      render: (product) => (
        <Badge color="blue" size="sm">
          {getProductTypeLabel(product.type)}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (product) => (
        <Badge color={product.isActive ? 'green' : 'gray'} size="sm">
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Edit size={14} />}
            onClick={() => handleEdit(product)}
            className="rounded-full"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Trash2 size={14} />}
            onClick={() => setDeleteConfirm(product)}
            className="rounded-full text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Products Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold text-black">Products</h1>
            <p className="text-sm text-black mt-1">Manage frames, sunglasses, contact lenses, and accessories</p>
          </div>
          <Button
            icon={<Plus size={18} />}
            onClick={handleCreate}
            className="rounded-full w-full sm:w-auto shrink-0"
          >
            {getAddButtonLabel()}
          </Button>
        </div>

        {/* Product Type Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-1">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = activeTab === type.value;
              if (!Icon) {
                console.error(`Icon not found for product type: ${type.value}`);
                return null;
              }
              return (
                <button
                  key={type.value}
                  onClick={() => handleTabChange(type.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search products by name, SKU, or brand..."
              value={search}
              onChange={(value) => setSearch(value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Package size={64} className="text-gray-400" />}
                title={`No ${getProductTypeLabel(activeTab).toLowerCase()} found`}
                description={`Create your first ${getProductTypeLabel(activeTab).toLowerCase().slice(0, -1)} to get started`}
                action={{
                  label: getAddButtonLabel(),
                  onClick: handleCreate
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredProducts}
              keyField="id"
            />
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingProduct ? 'Edit Product' : getAddButtonLabel()}
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
                className="rounded-full"
              >
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Product Type
              </label>
              <Badge color="blue" size="md">
                {getProductTypeLabel(formData.type)}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Product type is determined by the active tab</p>
            </div>

            <Select
              label="Brand *"
              value={formData.brandId}
              onChange={(value) => setFormData({ ...formData, brandId: value, subBrandId: '' })}
              options={[
                { value: '', label: 'Select a brand...' },
                ...brands.map(brand => ({
                  value: brand.id,
                  label: brand.name
                }))
              ]}
              error={formErrors.brandId}
              required
            />

            <Select
              label="Sub-Brand"
              value={formData.subBrandId}
              onChange={(value) => setFormData({ ...formData, subBrandId: value })}
              options={[
                { value: '', label: 'No sub-brand' },
                ...subBrands.map(sb => ({
                  value: sb.id,
                  label: sb.name
                }))
              ]}
              disabled={!formData.brandId || subBrands.length === 0}
            />

            <Input
              label="Product Name / Model"
              placeholder="e.g., Wayfarer 5121"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
            />

            <Input
              label="SKU"
              placeholder="e.g., RB-5121-BLK"
              value={formData.sku}
              onChange={(value) => setFormData({ ...formData, sku: value })}
            />

            <Input
              label="MRP *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.mrp}
              onChange={(value) => setFormData({ ...formData, mrp: value })}
              error={formErrors.mrp}
              required
            />

            <Input
              label="HSN Code"
              placeholder="e.g., 9001"
              value={formData.hsnCode}
              onChange={(value) => setFormData({ ...formData, hsnCode: value })}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-black">
                Active
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Product"
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
                onClick={() => handleDelete(deleteConfirm.id)}
                className="rounded-full bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-black">
            Are you sure you want to delete <strong>{deleteConfirm?.name || 'this product'}</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}
