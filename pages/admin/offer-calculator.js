import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Calculator, Tag, Percent, Ticket, Package } from 'lucide-react';

// CustomerCategory enum
const CustomerCategory = {
  STUDENT: 'STUDENT',
  DOCTOR: 'DOCTOR',
  TEACHER: 'TEACHER',
  ARMED_FORCES: 'ARMED_FORCES',
  SENIOR_CITIZEN: 'SENIOR_CITIZEN',
  CORPORATE: 'CORPORATE',
  REGULAR: 'REGULAR',
};

// BrandLine enum
const BrandLine = {
  LENSTRACK: 'LENSTRACK',
  KODAK: 'KODAK',
  ZEISS: 'ZEISS',
  RAYBAN: 'RAYBAN',
  TITAN: 'TITAN',
};

export default function OfferCalculatorPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Frame inputs
  const [frameBrand, setFrameBrand] = useState('');
  const [frameSubCategory, setFrameSubCategory] = useState('');
  const [frameMRP, setFrameMRP] = useState('');
  const [frameType, setFrameType] = useState('');

  // Lens inputs
  const [lensItCode, setLensItCode] = useState('');
  const [lensPrice, setLensPrice] = useState('');
  const [lensBrandLine, setLensBrandLine] = useState('');
  const [yopoEligible, setYopoEligible] = useState(false);

  // Customer & Coupon
  const [customerCategory, setCustomerCategory] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Second Pair
  const [secondPairEnabled, setSecondPairEnabled] = useState(false);
  const [secondPairFrameMRP, setSecondPairFrameMRP] = useState('');
  const [secondPairLensPrice, setSecondPairLensPrice] = useState('');

  const handleCalculate = async () => {
    if (!frameBrand || !frameMRP || !lensItCode || !lensPrice || !lensBrandLine) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    if (!user?.organizationId) {
      showToast('error', 'Organization not found');
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/offers/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          frame: {
            brand: frameBrand,
            subCategory: frameSubCategory || null,
            mrp: parseFloat(frameMRP),
            frameType: frameType || undefined,
          },
          lens: {
            itCode: lensItCode,
            price: parseFloat(lensPrice),
            brandLine: lensBrandLine,
            yopoEligible,
          },
          customerCategory: customerCategory || null,
          couponCode: couponCode || null,
          secondPair: secondPairEnabled ? {
            enabled: true,
            firstPairTotal: parseFloat(frameMRP) + parseFloat(lensPrice),
            secondPairFrameMRP: parseFloat(secondPairFrameMRP) || 0,
            secondPairLensPrice: parseFloat(secondPairLensPrice) || 0,
          } : null,
          organizationId: user.organizationId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        showToast('success', 'Offers calculated successfully!');
      } else {
        showToast('error', data.error?.message || 'Failed to calculate offers');
      }
    } catch (error) {
      console.error('Calculate error:', error);
      showToast('error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Offer Calculator">
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="text-blue-600 dark:text-blue-400" size={32} />
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 tracking-tight">
              Offer Calculator
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Calculate offers for frame + lens combinations
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Frame Details */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Frame Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Frame Brand *"
                    value={frameBrand}
                    onChange={(value) => setFrameBrand(value.toUpperCase())}
                    placeholder="e.g., LENSTRACK, RAYBAN"
                    required
                  />
                  <Input
                    label="Sub-Category"
                    value={frameSubCategory}
                    onChange={(value) => setFrameSubCategory(value)}
                    placeholder="e.g., ESSENTIAL, ADVANCED"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Frame MRP (₹) *"
                    type="number"
                    value={frameMRP}
                    onChange={(value) => setFrameMRP(value)}
                    placeholder="2500"
                    required
                  />
                  <Select
                    label="Frame Type"
                    value={frameType}
                    onChange={(value) => setFrameType(value)}
                    options={[
                      { value: '', label: 'Select...' },
                      { value: 'FULL_RIM', label: 'Full Rim' },
                      { value: 'HALF_RIM', label: 'Half Rim' },
                      { value: 'RIMLESS', label: 'Rimless' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Lens Details */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Lens Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="IT Code *"
                    value={lensItCode}
                    onChange={(value) => setLensItCode(value.toUpperCase())}
                    placeholder="e.g., D360ASV"
                    required
                  />
                  <Input
                    label="Lens Price (₹) *"
                    type="number"
                    value={lensPrice}
                    onChange={(value) => setLensPrice(value)}
                    placeholder="2500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Brand Line *"
                    value={lensBrandLine}
                    onChange={(value) => setLensBrandLine(value)}
                    options={[
                      { value: '', label: 'Select brand...' },
                      ...Object.values(BrandLine).map(v => ({ value: v, label: v }))
                    ]}
                    required
                  />
                  <div className="flex items-center gap-3 pt-8">
                    <input
                      type="checkbox"
                      checked={yopoEligible}
                      onChange={(e) => setYopoEligible(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      YOPO Eligible
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer & Offers */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Customer & Offers
              </h2>
              <div className="space-y-4">
                <Select
                  label="Customer Category"
                  value={customerCategory}
                  onChange={(value) => setCustomerCategory(value)}
                  options={[
                    { value: '', label: 'Regular Customer' },
                    ...Object.values(CustomerCategory).map(v => ({
                      value: v,
                      label: v.replace(/_/g, ' '),
                    })),
                  ]}
                />
                <Input
                  label="Coupon Code"
                  value={couponCode}
                  onChange={(value) => setCouponCode(value.toUpperCase())}
                  placeholder="e.g., WELCOME10"
                />
              </div>
            </Card>

            {/* Second Pair */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Second Pair
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={secondPairEnabled}
                    onChange={(e) => setSecondPairEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Enable Second Pair Offer
                  </label>
                </div>
                {secondPairEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Second Pair Frame MRP (₹)"
                      type="number"
                      value={secondPairFrameMRP}
                      onChange={(value) => setSecondPairFrameMRP(value)}
                      placeholder="1500"
                    />
                    <Input
                      label="Second Pair Lens Price (₹)"
                      type="number"
                      value={secondPairLensPrice}
                      onChange={(value) => setSecondPairLensPrice(value)}
                      placeholder="2000"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Calculate Button */}
            <Button
              onClick={handleCalculate}
              disabled={loading}
              loading={loading}
              size="lg"
              fullWidth
              icon={<Calculator size={20} />}
              className="rounded-full"
            >
              Calculate Offers
            </Button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            {result ? (
              <Card padding="lg" className="sticky top-6">
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-6">
                  Price Breakdown
                </h2>
                <div className="space-y-4">
                  {/* Base Prices */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Frame MRP</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        ₹{result.frameMRP?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Lens Price</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        ₹{result.lensPrice?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-900 dark:text-zinc-50">Base Total</span>
                      <span className="text-zinc-900 dark:text-zinc-50">
                        ₹{result.baseTotal?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Offers Applied */}
                  {result.offersApplied && result.offersApplied.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Primary Offers
                      </h3>
                      {result.offersApplied.map((offer, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-green-600 dark:text-green-400">
                          <span className="flex items-center gap-1">
                            <Tag size={12} />
                            {offer.description}
                          </span>
                          <span>-₹{offer.savings?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category Discount */}
                  {result.categoryDiscount && (
                    <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="flex items-center gap-1">
                        <Percent size={12} />
                        {result.categoryDiscount.description}
                      </span>
                      <span>-₹{result.categoryDiscount.savings?.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Coupon Discount */}
                  {result.couponDiscount && (
                    <div className="flex justify-between text-sm text-yellow-600 dark:text-yellow-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="flex items-center gap-1">
                        <Ticket size={12} />
                        {result.couponDiscount.description}
                      </span>
                      <span>-₹{result.couponDiscount.savings?.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Second Pair Discount */}
                  {result.secondPairDiscount && (
                    <div className="flex justify-between text-sm text-purple-600 dark:text-purple-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="flex items-center gap-1">
                        <Package size={12} />
                        {result.secondPairDiscount.description}
                      </span>
                      <span>-₹{result.secondPairDiscount.savings?.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Final Payable */}
                  <div className="pt-4 border-t-2 border-zinc-300 dark:border-zinc-700">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        Final Payable
                      </span>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{result.finalPayable?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>Total Savings</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        ₹{((result.baseTotal || 0) - (result.finalPayable || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Price Components Detail */}
                  {result.priceComponents && result.priceComponents.length > 0 && (
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        Detailed Breakdown
                      </h3>
                      <div className="space-y-1 text-xs">
                        {result.priceComponents.map((component, idx) => (
                          <div
                            key={idx}
                            className={`flex justify-between ${
                              component.amount < 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <span>{component.label}</span>
                            <span>
                              {component.amount < 0 ? '-' : ''}₹
                              {Math.abs(component.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card padding="lg" className="sticky top-6">
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  <Calculator size={48} className="mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
                  <p className="font-medium">Enter frame and lens details</p>
                  <p className="text-sm mt-1">Click "Calculate Offers" to see results</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

