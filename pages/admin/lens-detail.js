import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { lensProductService } from '../../services/lensProducts';
import { featureService } from '../../services/features';
import { benefitService } from '../../services/benefits';
import { Package, Settings, Sparkles, TrendingUp, ArrowLeft } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

// Lens Module Dev Spec V2 - Enums
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
  PHOTOCHROMIC: 'PHOTOCHROMIC',
  TRANSITION: 'TRANSITION'
};

const LensCategory = {
  ECONOMY: 'ECONOMY',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  ULTRA: 'ULTRA'
};

export default function AdminLensDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [lens, setLens] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [lensBrands, setLensBrands] = useState([]);
  
  // Specifications state
  const [newSpec, setNewSpec] = useState({ key: '', value: '', group: '' });
  
  // Benefits state
  const [availableBenefits, setAvailableBenefits] = useState([]);
  
  // RX Ranges state (V2 Spec - multiple ranges per lens)
  const [rxRanges, setRxRanges] = useState([]);

  const tabs = [
    { id: 'general', label: 'General', icon: Package },
    { id: 'rxRanges', label: 'RX Ranges', icon: Settings },
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'benefits', label: 'Benefits', icon: TrendingUp },
    { id: 'specifications', label: 'Specifications', icon: Settings },
  ];

  useEffect(() => {
    if (user?.organizationId) {
      fetchLensBrands();
      fetchFeatures();
      fetchBenefits();
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
    if (id && id !== 'new') {
      fetchLens();
    } else if (id === 'new') {
      setLens({
        id: '',
        itCode: '',
        name: '',
        brandLine: '', // V2: brandLine as string
        visionType: null, // V2: visionType
        lensIndex: null, // V2: lensIndex
        tintOption: TintOption.CLEAR, // V2: tintOption
        category: LensCategory.STANDARD, // V2: category
        baseOfferPrice: 0, // V2: baseOfferPrice
        addOnPrice: 0, // V2: addOnPrice
        deliveryDays: 4,
        yopoEligible: false,
        rxRanges: [], // V2: rxRanges array
        featureCodes: [], // V2: featureCodes array (F01-F11)
        benefitScores: {}, // V2: benefitScores object (B01-B12)
        specifications: [],
      });
      setLoading(false);
    }
  }, [id]);

  const fetchFeatures = async () => {
    try {
      const features = await featureService.list({ category: 'EYEGLASSES' });
      setAvailableFeatures(Array.isArray(features) ? features : []);
    } catch (error) {
      console.error('Failed to fetch features:', error);
    }
  };

  const fetchBenefits = async () => {
    try {
      const benefits = await benefitService.list();
      const benefitsList = Array.isArray(benefits) ? benefits : [];
      setAvailableBenefits(benefitsList);
      
      // Initialize benefitScores if lens exists and benefitScores is empty
      if (lens && (!lens.benefitScores || Object.keys(lens.benefitScores).length === 0)) {
        const initialScores = {};
        benefitsList.forEach(b => {
          if (b.code && /^B\d{2}$/.test(b.code)) {
            initialScores[b.code] = 0;
          }
        });
        setLens({
          ...lens,
          benefitScores: initialScores
        });
      }
    } catch (error) {
      console.error('Failed to fetch benefits:', error);
    }
  };


  const fetchLens = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/products/lenses/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      const lensData = data?.data || data;
      
      // V2 Spec response structure
      setLens({
        id: lensData.id || id,
        itCode: lensData.itCode || '',
        name: lensData.name || '',
        brandLine: lensData.brandLine || '',
        visionType: lensData.visionType || null,
        lensIndex: lensData.lensIndex || null,
        tintOption: lensData.tintOption || TintOption.CLEAR,
        category: lensData.category || LensCategory.STANDARD,
        baseOfferPrice: lensData.baseOfferPrice || 0,
        addOnPrice: lensData.addOnPrice || 0,
        deliveryDays: lensData.deliveryDays || 4,
        yopoEligible: lensData.yopoEligible !== false,
        isActive: lensData.isActive !== false,
        rxRanges: lensData.rxRanges || [],
        featureCodes: lensData.featureCodes || [],
        benefitScores: lensData.benefitScores || {},
        specifications: lensData.specifications || [],
      });
      
      // Set RX ranges state
      setRxRanges(lensData.rxRanges || []);
    } catch (error) {
      showToast('error', 'Failed to load lens');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lens) return;
    
    // Validation - V2 required fields
    if (!lens.itCode || !lens.name || !lens.brandLine || !lens.visionType || !lens.lensIndex || !lens.baseOfferPrice) {
      showToast('error', 'Please fill all required fields: IT Code, Name, Brand Line, Vision Type, Lens Index, and Base Offer Price');
      return;
    }
    
    if (lens.baseOfferPrice <= 0) {
      showToast('error', 'Base Offer Price must be greater than 0');
      return;
    }
    
    setSubmitting(true);
    try {
      const isNew = id === 'new';
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      
      // V2 Spec Contract
      const payload = {
        itCode: lens.itCode,
        name: lens.name,
        brandLine: lens.brandLine,
        visionType: lens.visionType,
        lensIndex: lens.lensIndex,
        tintOption: lens.tintOption || TintOption.CLEAR,
        baseOfferPrice: lens.baseOfferPrice,
        addOnPrice: lens.addOnPrice || 0,
        category: lens.category || LensCategory.STANDARD,
        yopoEligible: lens.yopoEligible,
        deliveryDays: lens.deliveryDays || 4,
        isActive: lens.isActive !== false,
        rxRanges: rxRanges || [],
        featureCodes: lens.featureCodes || [],
        benefitScores: lens.benefitScores || {},
        specifications: lens.specifications || []
      };
      
      const url = isNew ? '/api/admin/products/lenses' : `/api/admin/products/lenses/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('success', isNew ? 'Lens created successfully' : 'Lens updated successfully');
        router.push('/admin/lenses');
      } else {
        throw new Error(data.error?.message || 'Failed to save lens');
      }
    } catch (error) {
      showToast('error', error.message || 'Failed to save lens');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Lens Detail">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!lens) {
    return (
      <AdminLayout title="Lens Detail">
        <div className="text-center py-12">
          <p className="text-zinc-600 text-zinc-500">Lens not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Lens Detail">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/lenses')}
              className="rounded-full mb-4"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-black tracking-tight">
              {id === 'new' ? 'New Lens' : lens.name}
            </h1>
          </div>
          <Button 
            onClick={handleSave} 
            loading={submitting}
            className="rounded-full"
          >
            Save Lens
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200 border-zinc-200 mb-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 text-blue-600 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-zinc-600 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Tab 1: GENERAL - V2 Spec */}
          {activeTab === 'general' && (
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-black mb-6">General Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="IT Code *"
                    value={lens.itCode}
                    onChange={(value) => setLens({ ...lens, itCode: value })}
                    required
                  />
                  <Input
                    label="Name *"
                    value={lens.name}
                    onChange={(value) => setLens({ ...lens, name: value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Brand Line *"
                    value={lens.brandLine || ''}
                    onChange={(value) => setLens({ ...lens, brandLine: value || '' })}
                    options={[
                      { value: '', label: 'Select brand line...' },
                      ...lensBrands.filter(b => b.isActive).map(b => ({ 
                        value: b.name, 
                        label: b.name 
                      }))
                    ]}
                    required
                  />
                  <Select
                    label="Vision Type *"
                    value={lens.visionType || ''}
                    onChange={(value) => setLens({ ...lens, visionType: value || null })}
                    options={[
                      { value: '', label: 'Select vision type...' },
                      ...Object.entries(VisionType).map(([key, value]) => ({ value, label: key.replace(/_/g, ' ') }))
                    ]}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Lens Index *"
                    value={lens.lensIndex || ''}
                    onChange={(value) => setLens({ ...lens, lensIndex: value || null })}
                    options={[
                      { value: '', label: 'Select index...' },
                      ...Object.entries(LensIndex).map(([key, value]) => ({ 
                        value, 
                        label: key.replace('INDEX_', '').replace('_', '.') 
                      }))
                    ]}
                    required
                  />
                  <Select
                    label="Tint Option"
                    value={lens.tintOption || TintOption.CLEAR}
                    onChange={(value) => setLens({ ...lens, tintOption: value || TintOption.CLEAR })}
                    options={[
                      { value: TintOption.CLEAR, label: 'Clear' },
                      { value: TintOption.TINT, label: 'Tint' },
                      { value: TintOption.PHOTOCHROMIC, label: 'Photochromic' },
                      { value: TintOption.TRANSITION, label: 'Transition' }
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    value={lens.category || LensCategory.STANDARD}
                    onChange={(value) => setLens({ ...lens, category: value || LensCategory.STANDARD })}
                    options={[
                      { value: LensCategory.ECONOMY, label: 'Economy' },
                      { value: LensCategory.STANDARD, label: 'Standard' },
                      { value: LensCategory.PREMIUM, label: 'Premium' },
                      { value: LensCategory.ULTRA, label: 'Ultra' }
                    ]}
                  />
                  <Input
                    label="Delivery Days"
                    type="number"
                    value={lens.deliveryDays?.toString() || '4'}
                    onChange={(value) => setLens({ ...lens, deliveryDays: parseInt(value) || 4 })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Base Offer Price (₹) *"
                    type="number"
                    value={lens.baseOfferPrice?.toString() || '0'}
                    onChange={(value) => setLens({ ...lens, baseOfferPrice: parseFloat(value) || 0 })}
                    required
                  />
                  <Input
                    label="Add-on Price (₹)"
                    type="number"
                    value={lens.addOnPrice?.toString() || '0'}
                    onChange={(value) => setLens({ ...lens, addOnPrice: parseFloat(value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={lens.yopoEligible}
                    onChange={(e) => setLens({ ...lens, yopoEligible: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-300 border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-zinc-700">
                    YOPO Eligible
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Tab 2: RX RANGES - V2 Spec */}
          {activeTab === 'rxRanges' && (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-black">RX Ranges</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRxRanges([...rxRanges, {
                      sphMin: -10,
                      sphMax: 10,
                      cylMin: 0,
                      cylMax: -6,
                      addOnPrice: 0
                    }]);
                  }}
                  className="rounded-full"
                >
                  + Add RX Range
                </Button>
              </div>
              <div className="space-y-4">
                {rxRanges.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-8">No RX ranges defined. Click "Add RX Range" to add one.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 border-zinc-200">
                          <th className="text-left p-3 text-sm font-semibold text-zinc-700">SPH Min</th>
                          <th className="text-left p-3 text-sm font-semibold text-zinc-700">SPH Max</th>
                          <th className="text-left p-3 text-sm font-semibold text-zinc-700">CYL Min</th>
                          <th className="text-left p-3 text-sm font-semibold text-zinc-700">CYL Max</th>
                          <th className="text-left p-3 text-sm font-semibold text-zinc-700">Add-on Price</th>
                          <th className="text-left p-3 text-sm font-semibold text-zinc-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rxRanges.map((range, index) => (
                          <tr key={index} className="border-b border-zinc-100 border-zinc-100">
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.25"
                                value={range.sphMin?.toString() || '-10'}
                                onChange={(value) => {
                                  const updated = [...rxRanges];
                                  updated[index].sphMin = parseFloat(value) || -10;
                                  setRxRanges(updated);
                                }}
                                className="w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.25"
                                value={range.sphMax?.toString() || '10'}
                                onChange={(value) => {
                                  const updated = [...rxRanges];
                                  updated[index].sphMax = parseFloat(value) || 10;
                                  setRxRanges(updated);
                                }}
                                className="w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.25"
                                value={range.cylMin?.toString() || '0'}
                                onChange={(value) => {
                                  const updated = [...rxRanges];
                                  updated[index].cylMin = parseFloat(value) || 0;
                                  setRxRanges(updated);
                                }}
                                className="w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.25"
                                value={range.cylMax?.toString() || '-6'}
                                onChange={(value) => {
                                  const updated = [...rxRanges];
                                  updated[index].cylMax = parseFloat(value) || -6;
                                  setRxRanges(updated);
                                }}
                                className="w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={range.addOnPrice?.toString() || '0'}
                                onChange={(value) => {
                                  const updated = [...rxRanges];
                                  updated[index].addOnPrice = parseFloat(value) || 0;
                                  setRxRanges(updated);
                                }}
                                className="w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRxRanges(rxRanges.filter((_, i) => i !== index));
                                }}
                                className="rounded-full"
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Tab 2: SPECIFICATIONS */}
          {activeTab === 'specifications' && (
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-black mb-6">Specifications (Key/Value/Group)</h3>
              <div className="space-y-4">
                {/* Existing Specifications */}
                {lens.specifications && lens.specifications.length > 0 && (
                  <div className="space-y-2">
                    {lens.specifications.map((spec, index) => (
                      <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-zinc-50 bg-zinc-50 rounded-lg items-center">
                        <div>
                          <p className="text-xs text-zinc-500">Key</p>
                          <p className="font-medium text-zinc-900 text-black">{spec.key}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Value</p>
                          <p className="font-medium text-zinc-900 text-black">{spec.value}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Group</p>
                          <p className="font-medium text-zinc-900 text-black">{spec.group}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLens({
                              ...lens,
                              specifications: lens.specifications?.filter((_, i) => i !== index)
                            });
                          }}
                          className="rounded-full"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Specification */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 bg-blue-50 border border-blue-200 border-blue-200 rounded-lg">
                    <Input
                      label="Key"
                      placeholder="e.g., Material"
                      value={newSpec.key}
                      onChange={(value) => setNewSpec({ ...newSpec, key: value })}
                    />
                    <Input
                      label="Value"
                      placeholder="e.g., Polycarbonate"
                      value={newSpec.value}
                      onChange={(value) => setNewSpec({ ...newSpec, value: value })}
                    />
                    <Input
                      label="Group"
                      placeholder="e.g., MATERIAL"
                      value={newSpec.group}
                      onChange={(value) => setNewSpec({ ...newSpec, group: value })}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newSpec.key && newSpec.value && newSpec.group) {
                        setLens({
                          ...lens,
                          specifications: [...(lens.specifications || []), newSpec]
                        });
                        setNewSpec({ key: '', value: '', group: '' });
                        showToast('success', 'Specification added');
                      } else {
                        showToast('error', 'Please fill all fields');
                      }
                    }}
                    className="rounded-full"
                  >
                    + Add Specification
                  </Button>
                </div>
                <p className="text-sm text-zinc-500">
                  Groups: OPTICAL_DESIGN, MATERIAL, COATING, INDEX_USAGE, LIFESTYLE_TAG
                </p>
              </div>
            </Card>
          )}

          {/* Tab 3: FEATURES - V2 Spec (F01-F11 only) */}
          {activeTab === 'features' && (
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-black mb-6">Features (F01-F11)</h3>
              <div className="space-y-3">
                {availableFeatures && availableFeatures.length > 0 ? (
                  availableFeatures
                    .filter(f => {
                      const code = f.code || f.key || '';
                      return /^F\d{2}$/.test(code) && parseInt(code.substring(1)) >= 1 && parseInt(code.substring(1)) <= 11;
                    })
                    .sort((a, b) => {
                      const codeA = (a.code || a.key || '').substring(1);
                      const codeB = (b.code || b.key || '').substring(1);
                      return parseInt(codeA) - parseInt(codeB);
                    })
                    .map((feature) => {
                      const featureCode = feature.code || feature.key;
                      const isEnabled = lens.featureCodes && lens.featureCodes.includes(featureCode);

                      return (
                        <label 
                          key={feature.id || feature._id} 
                          className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const currentCodes = lens.featureCodes || [];
                              if (e.target.checked) {
                                if (!currentCodes.includes(featureCode)) {
                                  setLens({
                                    ...lens,
                                    featureCodes: [...currentCodes, featureCode]
                                  });
                                }
                              } else {
                                setLens({
                                  ...lens,
                                  featureCodes: currentCodes.filter(c => c !== featureCode)
                                });
                              }
                            }}
                            className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-mono text-sm text-zinc-500 w-12">
                            {featureCode}
                          </span>
                          <span className="text-zinc-700 flex-1">{feature.name}</span>
                        </label>
                      );
                    })
                ) : (
                  <p className="text-zinc-500 text-sm">Loading features...</p>
                )}
              </div>
            </Card>
          )}

          {/* Tab 4: BENEFITS - V2 Spec (B01-B12, 0-3 scale) */}
          {activeTab === 'benefits' && (
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-black mb-6">Benefits (B01-B12)</h3>
              <div className="space-y-4">
                {availableBenefits && availableBenefits.length > 0 ? (
                  availableBenefits
                    .filter(b => {
                      const code = b.code || '';
                      return /^B\d{2}$/.test(code) && parseInt(code.substring(1)) >= 1 && parseInt(code.substring(1)) <= 12;
                    })
                    .sort((a, b) => {
                      const codeA = (a.code || '').substring(1);
                      const codeB = (b.code || '').substring(1);
                      return parseInt(codeA) - parseInt(codeB);
                    })
                    .map((benefit) => {
                      const benefitCode = benefit.code;
                      const currentScore = lens.benefitScores?.[benefitCode] || 0;
                      const maxScore = benefit.maxScore || 3.0;
                      
                      return (
                        <div
                          key={benefit.id || benefit._id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            currentScore > 0
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-mono text-sm text-zinc-500 mr-2">{benefitCode}</span>
                              <span className="font-medium text-black">{benefit.name}</span>
                            </div>
                            <span className={`text-lg font-bold ${currentScore > 0 ? 'text-blue-600' : 'text-zinc-400'}`}>
                              {currentScore.toFixed(1)}/{maxScore}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max={maxScore}
                              step="0.1"
                              value={currentScore}
                              onChange={(e) => {
                                const newScore = parseFloat(e.target.value);
                                setLens({
                                  ...lens,
                                  benefitScores: {
                                    ...(lens.benefitScores || {}),
                                    [benefitCode]: newScore
                                  }
                                });
                              }}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                currentScore > 0 ? 'bg-blue-200' : 'bg-zinc-200'
                              }`}
                            />
                            <div className="flex justify-between text-xs text-zinc-500">
                              <span>0</span>
                              <span>{(maxScore / 2).toFixed(1)}</span>
                              <span>{maxScore}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-zinc-500 text-sm">Loading benefits...</p>
                )}
                <p className="text-sm text-zinc-500 mt-4">
                  Adjust scores (0-max scale) for each benefit to influence recommendation matching. Higher scores = better match for customers with this benefit need.
                </p>
              </div>
            </Card>
          )}

          {/* Tab 5: SPECIFICATIONS - V2 Spec */}
          {activeTab === 'specifications' && (
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-black mb-6">Specifications (Key/Value/Group)</h3>
              <div className="space-y-4">
                {/* Existing Specifications */}
                {lens.specifications && lens.specifications.length > 0 && (
                  <div className="space-y-2">
                    {lens.specifications.map((spec, index) => (
                      <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-zinc-50 bg-zinc-50 rounded-lg items-center">
                        <div>
                          <p className="text-xs text-zinc-500">Group</p>
                          <p className="font-medium text-zinc-900 text-black">{spec.group}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Key</p>
                          <p className="font-medium text-zinc-900 text-black">{spec.key}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Value</p>
                          <p className="font-medium text-zinc-900 text-black">{spec.value}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLens({
                              ...lens,
                              specifications: lens.specifications?.filter((_, i) => i !== index)
                            });
                          }}
                          className="rounded-full"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Specification */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 bg-blue-50 border border-blue-200 border-blue-200 rounded-lg">
                    <Select
                      label="Group"
                      value={newSpec.group}
                      onChange={(value) => setNewSpec({ ...newSpec, group: value || '' })}
                      options={[
                        { value: '', label: 'Select group...' },
                        { value: 'OPTICAL_DESIGN', label: 'Optical Design' },
                        { value: 'MATERIAL', label: 'Material' },
                        { value: 'COATING', label: 'Coating' },
                        { value: 'INDEX_USAGE', label: 'Index Usage' },
                        { value: 'LIFESTYLE_TAG', label: 'Lifestyle Tag' }
                      ]}
                    />
                    <Input
                      label="Key"
                      placeholder="e.g., Material Type"
                      value={newSpec.key}
                      onChange={(value) => setNewSpec({ ...newSpec, key: value })}
                    />
                    <Input
                      label="Value"
                      placeholder="e.g., Polycarbonate"
                      value={newSpec.value}
                      onChange={(value) => setNewSpec({ ...newSpec, value: value })}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newSpec.key && newSpec.value && newSpec.group) {
                        setLens({
                          ...lens,
                          specifications: [...(lens.specifications || []), { ...newSpec }]
                        });
                        setNewSpec({ key: '', value: '', group: '' });
                        showToast('success', 'Specification added');
                      } else {
                        showToast('error', 'Please fill all fields');
                      }
                    }}
                    className="rounded-full"
                  >
                    + Add Specification
                  </Button>
                </div>
                <p className="text-sm text-zinc-500">
                  Groups: OPTICAL_DESIGN, MATERIAL, COATING, INDEX_USAGE, LIFESTYLE_TAG
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

