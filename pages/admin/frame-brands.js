import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Tag, ChevronDown, ChevronRight, X } from 'lucide-react';

export default function FrameBrandsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [offerRules, setOfferRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isSubBrandModalOpen, setIsSubBrandModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [editingSubBrandId, setEditingSubBrandId] = useState(null);
  const [expandedBrands, setExpandedBrands] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Brand form
  const [brandFormData, setBrandFormData] = useState({
    brandName: '',
  });

  // Sub-brand form
  const [subBrandFormData, setSubBrandFormData] = useState({
    subBrandName: '',
    offerRuleIds: [],
  });

  useEffect(() => {
    if (user?.organizationId) {
      fetchBrands();
      fetchOfferRules();
    }
  }, [user]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/brands', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        const brandsData = Array.isArray(data.data) ? data.data : [];
        console.log('Loaded brands with sub-brands:', brandsData);
        setBrands(brandsData);
      } else {
        showToast('error', data.error?.message || 'Failed to load brands');
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
      showToast('error', 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferRules = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(
        `/api/admin/offers/rules?organizationId=${user.organizationId}&isActive=true`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const data = await response.json();
      if (data.success) {
        setOfferRules(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to load offer rules:', error);
    }
  };

  const handleCreateBrand = () => {
    setBrandFormData({ brandName: '' });
    setIsBrandModalOpen(true);
  };

  const handleSubmitBrand = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const trimmedBrandName = brandFormData.brandName?.trim() || '';
      if (!trimmedBrandName) {
        showToast('error', 'Brand name is required');
        setSubmitting(false);
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      if (!token) {
        showToast('error', 'Please login again');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedBrandName }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Brand created successfully');
        setIsBrandModalOpen(false);
        setBrandFormData({ brandName: '' });
        fetchBrands();
      } else {
        showToast('error', data.error?.message || 'Failed to create brand');
      }
    } catch (error) {
      console.error('Brand creation exception:', error);
      showToast('error', error?.message || 'Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubBrand = (brand) => {
    setSelectedBrand(brand);
    setEditingSubBrandId(null);
    setSubBrandFormData({
      subBrandName: '',
      offerRuleIds: [],
    });
    setIsSubBrandModalOpen(true);
  };

  const handleSubmitSubBrand = async (e) => {
    e.preventDefault();
    if (!selectedBrand) return;

    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/brands/${selectedBrand.id}/subbrands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: subBrandFormData.subBrandName,
          offerRuleIds: subBrandFormData.offerRuleIds
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Sub-brand created successfully');
        setIsSubBrandModalOpen(false);
        setSelectedBrand(null);
        fetchBrands();
      } else {
        showToast('error', data.error?.message || 'Failed to create sub-brand');
      }
    } catch (error) {
      console.error('Sub-brand creation error:', error);
      showToast('error', 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubBrand = async (brandId, subBrand) => {
    setSelectedBrand(brands.find((b) => b.id === brandId) || null);
    setEditingSubBrandId(subBrand.id);
    setSubBrandFormData({
      subBrandName: subBrand.name || subBrand.subBrandName || '',
      offerRuleIds: subBrand.offerRuleIds || [],
    });
    setIsSubBrandModalOpen(true);
  };

  const handleUpdateSubBrand = async (e) => {
    e.preventDefault();
    if (!selectedBrand || !editingSubBrandId) return;

    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(
        `/api/admin/brands/${selectedBrand.id}/subbrands/${editingSubBrandId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: subBrandFormData.subBrandName,
            offerRuleIds: subBrandFormData.offerRuleIds
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Sub-brand updated successfully');
        setIsSubBrandModalOpen(false);
        setSelectedBrand(null);
        setEditingSubBrandId(null);
        fetchBrands();
      } else {
        showToast('error', data.error?.message || 'Failed to update sub-brand');
      }
    } catch (error) {
      console.error('Sub-brand update error:', error);
      showToast('error', 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!confirm('Are you sure you want to delete this brand? This will also delete all its sub-brands.')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Brand deleted successfully');
        fetchBrands();
      } else {
        showToast('error', data.error?.message || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Brand delete error:', error);
      showToast('error', 'An error occurred');
    }
  };

  const handleDeleteSubBrand = async (brandId, subBrandId) => {
    if (!confirm('Are you sure you want to delete this sub-brand?')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(
        `/api/admin/brands/${brandId}/subbrands/${subBrandId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Sub-brand deleted successfully');
        fetchBrands();
      } else {
        showToast('error', data.error?.message || 'Failed to delete sub-brand');
      }
    } catch (error) {
      console.error('Sub-brand delete error:', error);
      showToast('error', 'An error occurred');
    }
  };

  const toggleBrand = (brandId) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
  };

  const filteredBrands = brands.filter((brand) => {
    const brandName = brand.name || brand.brandName || '';
    return brandName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout title="Frame Brands Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold text-black">Brands & Sub-Brands</h1>
            <p className="text-sm text-black mt-1">Manage brands and sub-brands for all product types (Frames, Sunglasses, Contact Lenses)</p>
          </div>
          <Button
            icon={<Plus size={18} />}
            onClick={handleCreateBrand}
            className="rounded-full w-full sm:w-auto shrink-0"
          >
            + Add Brand
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search brands..."
              value={search}
              onChange={(value) => setSearch(value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Brands List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Tag size={64} className="text-gray-400" />}
                title="No brands found"
                description="Create your first brand to get started"
                action={{
                  label: 'Add Brand',
                  onClick: handleCreateBrand,
                }}
              />
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredBrands.map((brand) => (
                <div key={brand.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleBrand(brand.id)}
                        className="text-gray-400 hover:text-black transition-colors"
                      >
                        {expandedBrands.has(brand.id) ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </button>
                      <Badge color="blue" size="md">
                        {brand.name || brand.brandName || 'Unnamed Brand'}
                      </Badge>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {brand.subBrands?.length || 0} sub-brand
                        {(brand.subBrands?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Plus size={14} />}
                        onClick={() => handleAddSubBrand(brand)}
                        className="rounded-full"
                      >
                        Add Sub-Brand
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleDeleteBrand(brand.id)}
                        className="rounded-full"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {expandedBrands.has(brand.id) && (
                    <div className="mt-4 ml-8 space-y-2">
                      {(!brand.subBrands || brand.subBrands.length === 0) ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          No sub-brands yet. Add one to get started.
                        </p>
                      ) : (
                        brand.subBrands.map((subBrand) => {
                          const mappedOffers = offerRules.filter((or) =>
                            (subBrand.offerRuleIds || []).includes(or.id)
                          );
                          return (
                            <div
                              key={subBrand.id}
                              className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge color="green" size="sm">
                                    {subBrand.name || subBrand.subBrandName}
                                  </Badge>
                                  {mappedOffers.length > 0 && (
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                      {mappedOffers.length} offer
                                      {mappedOffers.length !== 1 ? 's' : ''} mapped
                                    </span>
                                  )}
                                </div>
                                {mappedOffers.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {mappedOffers.map((offer) => (
                                      <Badge
                                        key={offer.id}
                                        color="purple"
                                        size="sm"
                                        variant="soft"
                                      >
                                        {offer.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  icon={<Edit2 size={14} />}
                                  onClick={() => handleEditSubBrand(brand.id, subBrand)}
                                  className="rounded-full"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  icon={<Trash2 size={14} />}
                                  onClick={() => handleDeleteSubBrand(brand.id, subBrand.id)}
                                  className="rounded-full"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Brand Modal */}
        <Modal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          title="Create Brand"
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsBrandModalOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBrand}
                loading={submitting}
                className="rounded-full"
              >
                Create
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmitBrand} className="space-y-4">
            <Input
              label="Brand Name *"
              placeholder="e.g., LensTrack, RayBan"
              value={brandFormData.brandName}
              onChange={(value) => setBrandFormData({ brandName: value })}
              required
              maxLength={100}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enter a unique brand name. This will be used to organize sub-brands for all product types.
            </p>
          </form>
        </Modal>

        {/* Create/Edit Sub-Brand Modal */}
        <Modal
          isOpen={isSubBrandModalOpen}
          onClose={() => {
            setIsSubBrandModalOpen(false);
            setSelectedBrand(null);
            setEditingSubBrandId(null);
          }}
          title={editingSubBrandId ? 'Edit Sub-Brand' : 'Add Sub-Brand'}
          size="lg"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubBrandModalOpen(false);
                  setSelectedBrand(null);
                  setEditingSubBrandId(null);
                }}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={editingSubBrandId ? handleUpdateSubBrand : handleSubmitSubBrand}
                loading={submitting}
                className="rounded-full"
              >
                {editingSubBrandId ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form
            onSubmit={editingSubBrandId ? handleUpdateSubBrand : handleSubmitSubBrand}
            className="space-y-4"
          >
            <Input
              label="Sub-Brand Name *"
              placeholder="e.g., ESSENTIAL, ADVANCED, PREMIUM"
              value={subBrandFormData.subBrandName}
              onChange={(value) =>
                setSubBrandFormData({ ...subBrandFormData, subBrandName: value })
              }
              required
              disabled={!!editingSubBrandId}
            />

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Map Offers{' '}
                {subBrandFormData.offerRuleIds.length > 0 &&
                  `(${subBrandFormData.offerRuleIds.length} selected)`}
              </label>

              {offerRules.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                  No offers available. Create offers first.
                </p>
              ) : (
                <>
                  <Select
                    placeholder={
                      offerRules.filter((o) => !subBrandFormData.offerRuleIds.includes(o.id))
                        .length === 0
                        ? 'All offers selected'
                        : 'Choose offers to map...'
                    }
                    options={[
                      { value: '', label: 'Select an offer...' },
                      ...offerRules
                        .filter((offer) => !subBrandFormData.offerRuleIds.includes(offer.id))
                        .map((offer) => ({
                          value: offer.id,
                          label: `${offer.name} (${offer.code})`,
                        })),
                    ]}
                    value=""
                    onChange={(selectedId) => {
                      if (
                        selectedId &&
                        !subBrandFormData.offerRuleIds.includes(selectedId)
                      ) {
                        setSubBrandFormData({
                          ...subBrandFormData,
                          offerRuleIds: [...subBrandFormData.offerRuleIds, selectedId],
                        });
                      }
                    }}
                    disabled={
                      offerRules.filter((o) => !subBrandFormData.offerRuleIds.includes(o.id))
                        .length === 0
                    }
                  />

                  {subBrandFormData.offerRuleIds.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        Selected Offers:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subBrandFormData.offerRuleIds.map((offerId) => {
                          const offer = offerRules.find((o) => o.id === offerId);
                          if (!offer) return null;
                          return (
                            <Badge
                              key={offerId}
                              color="blue"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              {offer.name}
                              <button
                                type="button"
                                onClick={() => {
                                  setSubBrandFormData({
                                    ...subBrandFormData,
                                    offerRuleIds: subBrandFormData.offerRuleIds.filter(
                                      (id) => id !== offerId
                                    ),
                                  });
                                }}
                                className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <X size={12} />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

