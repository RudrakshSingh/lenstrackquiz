import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { lensProductService } from '../../services/lensProducts';
import { ArrowLeft, X, Plus } from 'lucide-react';

const BrandLine = {
  LENSTRACK: 'LENSTRACK',
  KODAK: 'KODAK',
  ZEISS: 'ZEISS'
};

const VisionType = {
  SINGLE_VISION: 'SINGLE_VISION',
  PROGRESSIVE: 'PROGRESSIVE',
  BIFOCAL: 'BIFOCAL',
  ANTI_FATIGUE: 'ANTI_FATIGUE',
  MYOPIA_CONTROL: 'MYOPIA_CONTROL'
};

const LensIndex = {
  INDEX_156: 'INDEX_156',
  INDEX_160: 'INDEX_160',
  INDEX_167: 'INDEX_167',
  INDEX_174: 'INDEX_174'
};

const TintOption = {
  CLEAR: 'CLEAR',
  TINT: 'TINT',
  PHOTOCHROMIC: 'PHOTOCHROMIC'
};

export default function LensEntry() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    itCode: '',
    name: '',
    brandLine: 'LENSTRACK',
    visionType: 'SINGLE_VISION',
    lensIndex: 'INDEX_156',
    tintOption: 'CLEAR',
    mrp: 0,
    offerPrice: 0,
    addOnPrice: 0,
    sphMin: -8,
    sphMax: 8,
    cylMax: 4,
    addMin: 0,
    addMax: 3,
    deliveryDays: 4,
    warranty: '',
    yopoEligible: true,
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      loadLens(id);
    }
  }, [id]);

  const loadLens = async (lensId) => {
    setLoading(true);
    try {
      const response = await lensProductService.get(lensId);
      const data = response.data;
      if (data) {
        setFormData({
          itCode: data.itCode || '',
          name: data.name || '',
          brandLine: data.brandLine || 'LENSTRACK',
          visionType: data.visionType || 'SINGLE_VISION',
          lensIndex: data.lensIndex || 'INDEX_156',
          tintOption: data.tintOption || 'CLEAR',
          mrp: data.mrp || 0,
          offerPrice: data.offerPrice || 0,
          addOnPrice: data.addOnPrice || 0,
          sphMin: data.sphMin || -8,
          sphMax: data.sphMax || 8,
          cylMax: data.cylMax || 4,
          addMin: data.addMin || 0,
          addMax: data.addMax || 3,
          deliveryDays: data.deliveryDays || 4,
          warranty: data.warranty || '',
          yopoEligible: data.yopoEligible !== false,
          isActive: data.isActive !== false,
        });
      }
    } catch (err) {
      showToast('error', 'Failed to load lens data');
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
      if (id) {
        await lensProductService.update(id, formData);
        showToast('success', 'Lens updated successfully');
      } else {
        await lensProductService.create(formData);
        showToast('success', 'Lens created successfully');
        setTimeout(() => {
          router.push('/admin/lenses');
        }, 1500);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to save lens');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={id ? 'Edit Lens Product' : 'Add New Lens Product'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? 'Edit Lens Product' : 'Add New Lens Product'}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/products')}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="hover-lift"
          >
            Back to Products
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="IT Code *"
                value={formData.itCode}
                onChange={(value) => handleChange('itCode', value)}
                placeholder="e.g., LENS-BLUE-001"
                required
              />
              <Input
                label="Product Name *"
                value={formData.name}
                onChange={(value) => {
                  // Don't allow brandline values in product name
                  const brandLineValues = Object.values(BrandLine);
                  const hasBrandLine = brandLineValues.some(brand => 
                    value.toLowerCase().includes(brand.toLowerCase())
                  );
                  if (!hasBrandLine) {
                    handleChange('name', value);
                  } else {
                    showToast('error', 'Product name should not include brand name. Brand is selected separately.');
                  }
                }}
                placeholder="e.g., BlueXpert Advanced, Premium AR Coating"
                required
              />
              <div className="md:col-span-2">
                <Select
                  label="Brand Line *"
                  value={formData.brandLine}
                  onChange={(value) => handleChange('brandLine', value)}
                  required
                  options={Object.entries(BrandLine).map(([key, value]) => ({
                    value,
                    label: value
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Select brand: Lenstrack, Kodak, or Zeiss</p>
              </div>
              <Select
                label="Vision Type *"
                value={formData.visionType}
                onChange={(value) => {
                  handleChange('visionType', value);
                  // Clear ADD fields if SINGLE_VISION is selected
                  if (value === 'SINGLE_VISION') {
                    setFormData(prev => ({
                      ...prev,
                      visionType: value,
                      addMin: 0,
                      addMax: 0
                    }));
                  }
                }}
                required
                options={Object.entries(VisionType).map(([key, value]) => ({
                  value,
                  label: value.replace(/_/g, ' ')
                }))}
              />
              <Select
                label="Lens Index *"
                value={formData.lensIndex}
                onChange={(value) => handleChange('lensIndex', value)}
                required
                options={Object.entries(LensIndex).map(([key, value]) => ({
                  value,
                  label: value.replace('INDEX_', '')
                }))}
              />
              <Select
                label="Tint Option *"
                value={formData.tintOption}
                onChange={(value) => handleChange('tintOption', value)}
                required
                options={Object.entries(TintOption).map(([key, value]) => ({
                  value,
                  label: value
                }))}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="MRP (₹) *"
                type="number"
                value={formData.mrp.toString()}
                onChange={(value) => handleChange('mrp', parseFloat(value) || 0)}
                min="0"
                required
              />
              <Input
                label="Offer Price (₹) *"
                type="number"
                value={formData.offerPrice.toString()}
                onChange={(value) => handleChange('offerPrice', parseFloat(value) || 0)}
                min="0"
                required
              />
              <Input
                label="Add-on Price (₹)"
                type="number"
                value={formData.addOnPrice.toString()}
                onChange={(value) => handleChange('addOnPrice', parseFloat(value) || 0)}
                min="0"
              />
            </div>
          </div>

          {/* Power Range */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Power Support Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input
                label="SPH Min"
                type="number"
                step="0.25"
                value={formData.sphMin.toString()}
                onChange={(value) => handleChange('sphMin', parseFloat(value) || -8)}
                placeholder="-8"
              />
              <Input
                label="SPH Max"
                type="number"
                step="0.25"
                value={formData.sphMax.toString()}
                onChange={(value) => handleChange('sphMax', parseFloat(value) || 8)}
                placeholder="8"
              />
              <Input
                label="CYL Max"
                type="number"
                step="0.25"
                value={formData.cylMax.toString()}
                onChange={(value) => handleChange('cylMax', parseFloat(value) || 4)}
                placeholder="4"
              />
              {/* Only show ADD fields if vision type is not SINGLE_VISION */}
              {formData.visionType !== 'SINGLE_VISION' && (
                <>
                  <Input
                    label="ADD Min"
                    type="number"
                    step="0.25"
                    value={formData.addMin.toString()}
                    onChange={(value) => handleChange('addMin', parseFloat(value) || 0)}
                    placeholder="0"
                  />
                  <Input
                    label="ADD Max"
                    type="number"
                    step="0.25"
                    value={formData.addMax.toString()}
                    onChange={(value) => handleChange('addMax', parseFloat(value) || 3)}
                    placeholder="3"
                  />
                </>
              )}
            </div>
            {formData.visionType === 'SINGLE_VISION' && (
              <p className="text-sm text-gray-500 mt-2">ADD (Addition) fields are only applicable for Progressive, Bifocal, and other near-vision lens types.</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Delivery Days"
                type="number"
                value={formData.deliveryDays.toString()}
                onChange={(value) => handleChange('deliveryDays', parseInt(value) || 4)}
                min="1"
              />
              <Input
                label="Warranty"
                value={formData.warranty}
                onChange={(value) => handleChange('warranty', value)}
                placeholder="e.g., 1 Year"
              />
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Options</h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.yopoEligible}
                  onChange={(e) => handleChange('yopoEligible', e.target.checked)}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">YOPO Eligible (You Only Pay for One)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Active (Show in catalog)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Button variant="outline" onClick={() => router.back()} size="md" className="hover-lift">
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary" size="md" className="hover-lift">
              {id ? 'Update Lens Product' : 'Create Lens Product'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
