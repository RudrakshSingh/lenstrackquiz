import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { productService } from '../../services/products';
import { lensProductService } from '../../services/lensProducts';
import { featureService } from '../../services/features';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [lensProducts, setLensProducts] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    brand: '',
    basePrice: 0,
    description: '',
    imageUrl: '',
    features: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchLensProducts();
    fetchFeatures();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (search) {
        params.search = search;
      }
      const data = await productService.list(params);
      setProducts(Array.isArray(data) ? data : data?.products || []);
    } catch (error) {
      showToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchLensProducts = async () => {
    try {
      const data = await lensProductService.list({});
      setLensProducts(data || []);
    } catch (error) {
      console.error('Failed to load lens products:', error);
    }
  };

  const fetchFeatures = async () => {
    try {
      const data = await featureService.list();
      setFeatures(Array.isArray(data) ? data : data?.features || []);
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setTimeout(() => {
      fetchProducts();
    }, 300);
  };

  const handleCreate = () => {
    setFormData({
      sku: '',
      name: '',
      category: '',
      brand: '',
      basePrice: 0,
      description: '',
      imageUrl: '',
      features: [],
    });
    setFormErrors({});
    setEditingProduct(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category || '',
      brand: product.brand || '',
      basePrice: product.basePrice || 0,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      features: product.features || [],
    });
    setFormErrors({});
    setEditingProduct(product);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id || editingProduct._id, formData);
        showToast('success', 'Product updated successfully');
      } else {
        await productService.create(formData);
        showToast('success', 'Product created successfully');
      }
      setIsCreateOpen(false);
      fetchProducts();
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR' && error.details) {
        setFormErrors(error.details);
      } else {
        showToast('error', error.message || 'Failed to save product');
      }
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteConfirm.type === 'lens') {
        await lensProductService.delete(deleteConfirm.id || deleteConfirm._id);
      } else {
        await productService.delete(deleteConfirm.id || deleteConfirm._id);
      }
      showToast('success', 'Product deleted successfully');
      setDeleteConfirm(null);
      fetchProducts();
      fetchLensProducts();
    } catch (error) {
      showToast('error', error.message || 'Failed to delete product');
    }
  };

  // Combine regular products and lens products for display
  const allProducts = [
    ...products.map(p => ({ ...p, type: 'product', displayName: p.name })),
    ...lensProducts.map(p => ({ ...p, type: 'lens', displayName: p.name, sku: p.itCode, category: 'LENS', brand: p.brandLine }))
  ];

  const filteredProducts = allProducts.filter(product => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.itCode?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.brandLine?.toLowerCase().includes(searchLower)
      );
    }
    if (categoryFilter !== 'all') {
      return product.category === categoryFilter || (categoryFilter === 'LENS' && product.type === 'lens');
    }
    return true;
  });

  const columns = [
    { 
      key: 'sku', 
      header: 'SKU/IT Code',
      render: (item) => item.sku || item.itCode || 'N/A'
    },
    { 
      key: 'name', 
      header: 'Name',
      render: (item) => (
        <div>
          <div className="font-medium">{item.displayName || item.name}</div>
          {item.type === 'lens' && (
            <Badge color="blue" variant="soft" size="sm" className="mt-1">
              Lens Product
            </Badge>
          )}
        </div>
      )
    },
    { 
      key: 'category', 
      header: 'Category',
      render: (item) => item.category || (item.type === 'lens' ? 'LENS' : 'N/A')
    },
    { 
      key: 'brand', 
      header: 'Brand',
      render: (item) => item.brand || item.brandLine || 'N/A'
    },
    {
      key: 'price',
      header: 'Price',
      render: (item) => {
        if (item.type === 'lens') {
          return `₹${item.offerPrice || item.mrp || 0}`;
        }
        return `₹${item.basePrice || 0}`;
      },
    },
  ];

  return (
    <AdminLayout title="Product Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500 mt-1">Manage product catalog and inventory</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
              Add Product
            </Button>
            <Button 
              onClick={() => router.push('/admin/lens-entry')} 
              icon={<Plus className="h-4 w-4" />}
              variant="primary"
            >
              Add Lens Product
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name, SKU, or brand..."
              value={search}
              onChange={handleSearch}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="all">All Categories</option>
            <option value="LENS">Lens Products</option>
            <option value="EYEGLASSES">Eyeglasses</option>
            <option value="SUNGLASSES">Sunglasses</option>
            <option value="CONTACT_LENSES">Contact Lenses</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <DataTable
            columns={columns}
            data={filteredProducts}
            loading={loading}
            emptyMessage="No products found"
            rowActions={(item) => (
              <div className="flex gap-2">
                {item.type === 'lens' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/lens-entry?id=${item.id}`);
                    }}
                    className="text-primary hover:text-primary-hover"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="text-primary hover:text-primary-hover"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
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
          title={editingProduct ? 'Edit Product' : 'Create Product'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU"
                value={formData.sku}
                onChange={(value) => setFormData({ ...formData, sku: value })}
                required
                error={formErrors.sku}
              />
              <Input
                label="Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                error={formErrors.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                options={[
                  { value: 'EYEGLASSES', label: 'Eyeglasses' },
                  { value: 'SUNGLASSES', label: 'Sunglasses' },
                  { value: 'CONTACT_LENSES', label: 'Contact Lenses' },
                  { value: 'ACCESSORIES', label: 'Accessories' },
                ]}
                required
                error={formErrors.category}
              />
              <Input
                label="Brand"
                value={formData.brand}
                onChange={(value) => setFormData({ ...formData, brand: value })}
                error={formErrors.brand}
              />
            </div>
            <Input
              label="Base Price"
              type="number"
              value={formData.basePrice}
              onChange={(value) => setFormData({ ...formData, basePrice: parseFloat(value) || 0 })}
              required
              error={formErrors.basePrice}
            />
            <Input
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              error={formErrors.description}
            />
            <Input
              label="Image URL"
              type="url"
              value={formData.imageUrl}
              onChange={(value) => setFormData({ ...formData, imageUrl: value })}
              error={formErrors.imageUrl}
            />
            <div className="text-sm text-gray-500">
              Note: Feature assignment and store-specific settings can be configured after creating the product.
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

