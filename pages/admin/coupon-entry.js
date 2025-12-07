import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { offerService } from '../../services/offers';
import { ArrowLeft, Ticket, Save, X } from 'lucide-react';

const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT_AMOUNT: 'FLAT_AMOUNT'
};

export default function CouponEntry() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    maxDiscount: null,
    minCartValue: null,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (id) {
      loadCoupon(id);
    }
  }, [id]);

  const loadCoupon = async (couponId) => {
    setLoading(true);
    try {
      const response = await offerService.getCoupon(couponId);
      const data = response.data;
      if (data) {
        setFormData({
          code: data.code || '',
          description: data.description || '',
          discountType: data.discountType || 'PERCENTAGE',
          discountValue: data.discountValue || 0,
          maxDiscount: data.maxDiscount || null,
          minCartValue: data.minCartValue || null,
          isActive: data.isActive !== false,
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        });
      }
    } catch (err) {
      showToast('error', 'Failed to load coupon data');
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
        discountValue: parseFloat(formData.discountValue) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        minCartValue: formData.minCartValue ? parseFloat(formData.minCartValue) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      if (id) {
        await offerService.updateCoupon(id, submitData);
        showToast('success', 'Coupon updated successfully');
      } else {
        await offerService.createCoupon(submitData);
        showToast('success', 'Coupon created successfully');
        setTimeout(() => {
          router.push('/admin/offer-mapping');
        }, 1500);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={id ? 'Edit Coupon' : 'Add New Coupon'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? 'Edit Coupon' : 'Add New Coupon'}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/offer-mapping')}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="hover-lift"
          >
            Back to Offer Mapping
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Ticket className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Coupon Details</h2>
            </div>
            <p className="text-green-100">Create or edit coupon codes for customer discounts</p>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-indigo-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Coupon Code *"
                value={formData.code}
                onChange={(value) => handleChange('code', value.toUpperCase())}
                required
                placeholder="e.g., WELCOME10"
                helpText="Code will be converted to uppercase"
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(value) => handleChange('description', value)}
                placeholder="e.g., 10% off for new customers"
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
                label="Discount Value *"
                type="number"
                value={formData.discountValue.toString()}
                onChange={(value) => handleChange('discountValue', value)}
                required
                placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g., 10 for 10%' : 'e.g., 500 for ₹500'}
                helpText={formData.discountType === 'PERCENTAGE' ? 'Enter percentage (e.g., 10 for 10%)' : 'Enter flat amount in rupees'}
              />
            </div>
          </div>

          {/* Discount Limits */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Limits & Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.discountType === 'PERCENTAGE' && (
                <Input
                  label="Maximum Discount (Optional)"
                  type="number"
                  value={formData.maxDiscount?.toString() || ''}
                  onChange={(value) => handleChange('maxDiscount', value || null)}
                  placeholder="e.g., 500 (caps discount at ₹500)"
                  helpText="Maximum discount amount in rupees"
                />
              )}
              <Input
                label="Minimum Cart Value (Optional)"
                type="number"
                value={formData.minCartValue?.toString() || ''}
                onChange={(value) => handleChange('minCartValue', value || null)}
                placeholder="e.g., 2000 (minimum cart total)"
                helpText="Minimum cart value required to use this coupon"
              />
            </div>
          </div>

          {/* Validity */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Validity Period</h3>
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
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                  Active (Enable this coupon)
                </span>
                <p className="text-xs text-gray-500 mt-1">Inactive coupons cannot be used by customers</p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button variant="outline" onClick={() => router.back()} size="md" className="hover-lift" icon={<X className="h-4 w-4" />}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary" size="md" className="hover-lift" icon={<Save className="h-4 w-4" />}>
              {id ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

