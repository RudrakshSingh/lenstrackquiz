import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { offerService } from '../../services/offers';
import { ArrowLeft, Users, Save, X } from 'lucide-react';

const CustomerCategory = {
  STUDENT: 'STUDENT',
  DOCTOR: 'DOCTOR',
  TEACHER: 'TEACHER',
  ARMED_FORCES: 'ARMED_FORCES',
  SENIOR_CITIZEN: 'SENIOR_CITIZEN',
  CORPORATE: 'CORPORATE'
};

export default function CategoryDiscountEntry() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    customerCategory: 'STUDENT',
    brandCode: '*',
    discountPercent: 10,
    maxDiscount: null,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (id) {
      loadDiscount(id);
    }
  }, [id]);

  const loadDiscount = async (discountId) => {
    setLoading(true);
    try {
      const response = await offerService.getCategoryDiscount?.(discountId);
      const data = response?.data;
      if (data) {
        setFormData({
          customerCategory: data.customerCategory || 'STUDENT',
          brandCode: data.brandCode || '*',
          discountPercent: data.discountPercent || 10,
          maxDiscount: data.maxDiscount || null,
          isActive: data.isActive !== false,
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        });
      }
    } catch (err) {
      showToast('error', 'Failed to load category discount data');
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
        discountPercent: parseFloat(formData.discountPercent) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      await offerService.createCategoryDiscount(submitData);
      showToast('success', 'Category discount created successfully');
      setTimeout(() => {
        router.push('/admin/offer-mapping');
      }, 1500);
    } catch (err) {
      showToast('error', err.message || 'Failed to save category discount');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Add Category Discount">
        <div className="flex items-center justify-center py-12">
          <div className="text-black">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Add Category Discount">
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
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Category Discount</h2>
            </div>
            <p className="text-blue-100">Set discounts for specific customer categories</p>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Discount Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Customer Category *"
                value={formData.customerCategory}
                onChange={(value) => handleChange('customerCategory', value)}
                required
                options={Object.entries(CustomerCategory).map(([key, value]) => ({
                  value,
                  label: value.replace(/_/g, ' ')
                }))}
              />
              <Input
                label="Brand Code *"
                value={formData.brandCode}
                onChange={(value) => handleChange('brandCode', value)}
                required
                placeholder="* for all brands or specific brand code"
                helpText="Use * for all frame brands, or enter specific brand code"
              />
              <Input
                label="Discount Percentage *"
                type="number"
                value={formData.discountPercent.toString()}
                onChange={(value) => handleChange('discountPercent', value)}
                required
                placeholder="e.g., 10 for 10%"
                helpText="Discount percentage (typically 5-15%)"
                min="0"
                max="100"
              />
              <Input
                label="Maximum Discount (Optional)"
                type="number"
                value={formData.maxDiscount?.toString() || ''}
                onChange={(value) => handleChange('maxDiscount', value || null)}
                placeholder="e.g., 500 (caps discount at ₹500)"
                helpText="Maximum discount amount in rupees"
              />
            </div>
          </div>

          {/* Validity */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-black mb-4">Validity Period</h3>
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
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold text-black mb-4">Status</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-black group-hover:text-indigo-600 transition-colors">
                  Active (Enable this discount)
                </span>
                <p className="text-xs text-black mt-1">Inactive discounts will not be applied</p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="outline" onClick={() => router.back()} size="md" className="hover-lift" icon={<X className="h-4 w-4" />}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary" size="md" className="hover-lift" icon={<Save className="h-4 w-4" />}>
              Create Category Discount
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

