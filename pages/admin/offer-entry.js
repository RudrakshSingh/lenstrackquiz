import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { offerService } from '../../services/offers';
import { ArrowLeft, Tag, Target, Calendar, CheckCircle } from 'lucide-react';

const OfferType = {
  YOPO: 'YOPO',
  BOGO_50: 'BOGO_50',
  FREE_LENS: 'FREE_LENS',
  COMBO_PRICE: 'COMBO_PRICE',
  PERCENT_OFF: 'PERCENT_OFF',
  FLAT_OFF: 'FLAT_OFF'
};

const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT_AMOUNT: 'FLAT_AMOUNT',
  YOPO_LOGIC: 'YOPO_LOGIC',
  FREE_ITEM: 'FREE_ITEM',
  COMBO_PRICE: 'COMBO_PRICE'
};

export default function OfferEntry() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    offerType: 'YOPO',
    discountType: 'YOPO_LOGIC',
    discountValue: 0,
    comboPrice: null,
    frameBrand: '',
    frameSubCategory: '',
    minFrameMRP: null,
    maxFrameMRP: null,
    lensBrandLines: [],
    lensItCodes: [],
    isSecondPairRule: false,
    secondPairPercent: null,
    priority: 100,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (id) {
      loadOffer(id);
    }
  }, [id]);

  const loadOffer = async (offerId) => {
    setLoading(true);
    try {
      const response = await offerService.getRule(offerId);
      const data = response.data;
      if (data) {
        setFormData({
          name: data.name || '',
          code: data.code || '',
          offerType: data.offerType || 'YOPO',
          discountType: data.discountType || 'YOPO_LOGIC',
          discountValue: data.discountValue || 0,
          comboPrice: data.comboPrice || null,
          frameBrand: data.frameBrand || '',
          frameSubCategory: data.frameSubCategory || '',
          minFrameMRP: data.minFrameMRP || null,
          maxFrameMRP: data.maxFrameMRP || null,
          lensBrandLines: data.lensBrandLines || [],
          lensItCodes: data.lensItCodes || [],
          isSecondPairRule: data.isSecondPairRule || false,
          secondPairPercent: data.secondPairPercent || null,
          priority: data.priority || 100,
          isActive: data.isActive !== false,
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        });
      }
    } catch (err) {
      showToast('error', 'Failed to load offer data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = {
        ...formData,
        minFrameMRP: formData.minFrameMRP ? parseFloat(formData.minFrameMRP) : null,
        maxFrameMRP: formData.maxFrameMRP ? parseFloat(formData.maxFrameMRP) : null,
        discountValue: parseFloat(formData.discountValue) || 0,
        comboPrice: formData.comboPrice ? parseFloat(formData.comboPrice) : null,
        secondPairPercent: formData.secondPairPercent ? parseFloat(formData.secondPairPercent) : null,
        priority: parseInt(formData.priority) || 100,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      if (id) {
        await offerService.updateRule(id, submitData);
        showToast('success', 'Offer updated successfully');
      } else {
        await offerService.createRule(submitData);
        showToast('success', 'Offer created successfully');
        setTimeout(() => {
          router.push('/admin/offers');
        }, 1500);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={id ? 'Edit Offer' : 'Add New Offer'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? 'Edit Offer' : 'Add New Offer'}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/offers')}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="hover-lift"
          >
            Back to Offers
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Offer Rule Details</h2>
            </div>
            <p className="text-indigo-100">Configure offer rules for frames and lenses</p>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Offer Name *"
                value={formData.name}
                onChange={(value) => handleChange('name', value)}
                required
                placeholder="e.g., YOPO Progressive Offer"
              />
              <Input
                label="Offer Code *"
                value={formData.code}
                onChange={(value) => handleChange('code', value)}
                required
                placeholder="e.g., OFFER_YOPO_PROG_001"
              />
              <Select
                label="Offer Type *"
                value={formData.offerType}
                onChange={(value) => handleChange('offerType', value)}
                required
                options={Object.entries(OfferType).map(([key, value]) => ({
                  value,
                  label: value.replace(/_/g, ' ')
                }))}
              />
              <Select
                label="Discount Type *"
                value={formData.discountType}
                onChange={(value) => handleChange('discountType', value)}
                required
                options={Object.entries(DiscountType).map(([key, value]) => ({
                  value,
                  label: value.replace(/_/g, ' ')
                }))}
              />
              <Input
                label="Discount Value"
                type="number"
                value={formData.discountValue.toString()}
                onChange={(value) => handleChange('discountValue', value)}
                placeholder="Percentage or flat amount"
              />
              <Input
                label="Combo Price (if applicable)"
                type="number"
                value={formData.comboPrice?.toString() || ''}
                onChange={(value) => handleChange('comboPrice', value || null)}
                placeholder="Fixed combo price"
              />
              <Input
                label="Priority"
                type="number"
                value={formData.priority.toString()}
                onChange={(value) => handleChange('priority', value)}
                placeholder="Lower number = higher priority"
              />
            </div>
          </div>

          {/* Target Filters */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Target Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Frame Brand"
                value={formData.frameBrand}
                onChange={(value) => handleChange('frameBrand', value)}
                placeholder="e.g., Lenstrack Essentials"
              />
              <Input
                label="Frame Sub Category"
                value={formData.frameSubCategory}
                onChange={(value) => handleChange('frameSubCategory', value)}
                placeholder="e.g., Premium Metal"
              />
              <Input
                label="Min Frame MRP"
                type="number"
                value={formData.minFrameMRP?.toString() || ''}
                onChange={(value) => handleChange('minFrameMRP', value || null)}
                placeholder="Minimum frame MRP"
              />
              <Input
                label="Max Frame MRP"
                type="number"
                value={formData.maxFrameMRP?.toString() || ''}
                onChange={(value) => handleChange('maxFrameMRP', value || null)}
                placeholder="Maximum frame MRP"
              />
            </div>
          </div>

          {/* Second Pair Rule */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Second Pair Rule</h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isSecondPairRule}
                  onChange={(e) => handleChange('isSecondPairRule', e.target.checked)}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">This is a second pair rule</span>
              </label>
              {formData.isSecondPairRule && (
                <Input
                  label="Second Pair Discount %"
                  type="number"
                  value={formData.secondPairPercent?.toString() || ''}
                  onChange={(value) => handleChange('secondPairPercent', value || null)}
                  placeholder="e.g., 50 for 50% off"
                />
              )}
            </div>
          </div>

          {/* Validity */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Validity Period
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(value) => handleChange('startDate', value)}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(value) => handleChange('endDate', value)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-indigo-600" />
              Status
            </h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                  Active (Enable this offer)
                </span>
                <p className="text-xs text-gray-500 mt-1">Inactive offers will not be applied to calculations</p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Button variant="outline" onClick={() => router.back()} size="md" className="hover-lift">
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary" size="md" className="hover-lift">
              {id ? 'Update Offer' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
