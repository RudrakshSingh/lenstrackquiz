// pages/offer-demo.js
// Demo page showcasing all Offer Engine frontend components

import { useState } from 'react';
import { CartProvider, useCart } from '../contexts/CartContext';
import AppliedOffersDisplay from '../components/offer/AppliedOffersDisplay';
import OfferBreakdownPanel from '../components/offer/OfferBreakdownPanel';
import UpsellBanner from '../components/offer/UpsellBanner';
import LensComparison from '../components/offer/LensComparison';
import PriceMatrix from '../components/offer/PriceMatrix';
import OrderSummary from '../components/offer/OrderSummary';
import Button from '../components/ui/Button';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';

function OfferDemoContent() {
  const { 
    frame, 
    setFrame, 
    lens, 
    setLens, 
    customerCategory, 
    setCustomerCategory,
    couponCode,
    setCouponCode,
    offerEngineResult,
    loading,
    error
  } = useCart();

  const [upsellPlacement, setUpsellPlacement] = useState('top');
  const [showLensComparison, setShowLensComparison] = useState(false);
  const [showPriceMatrix, setShowPriceMatrix] = useState(false);

  // Sample lenses for demo
  const sampleLenses = [
    {
      id: '1',
      itCode: 'D360ASV',
      name: 'DIGI360 Advanced',
      brandLine: 'DIGI360_ADVANCED',
      price: 4500,
      mrp: 5000,
      yopoEligible: true,
      visionType: 'PROGRESSIVE',
      index: 1.67,
      blueProtection: 5,
      uvProtection: 5,
      arLevel: 4,
      drivingSupport: 3
    },
    {
      id: '2',
      itCode: 'BLUEXPERT',
      name: 'BlueXpert',
      brandLine: 'BLUEXPERT',
      price: 999,
      mrp: 1200,
      yopoEligible: false,
      visionType: 'SV_DISTANCE',
      index: 1.60,
      blueProtection: 4,
      uvProtection: 4,
      arLevel: 3,
      drivingSupport: 2
    },
    {
      id: '3',
      itCode: 'DRIVEXPERT',
      name: 'DriveXpert',
      brandLine: 'DRIVEXPERT',
      price: 3500,
      mrp: 4000,
      yopoEligible: true,
      visionType: 'SV_DISTANCE',
      index: 1.67,
      blueProtection: 3,
      uvProtection: 5,
      arLevel: 5,
      drivingSupport: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Offer Engine Frontend Demo</h1>
          <p className="text-indigo-100 text-lg">
            Showcasing all frontend components from Frontend Dev Spec V2 Final
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Cart Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cart Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frame Brand</label>
              <input
                type="text"
                value={frame?.brand || ''}
                onChange={(e) => setFrame({ ...frame, brand: e.target.value, mrp: frame?.mrp || 2500 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="LENSTRACK"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frame MRP (₹)</label>
              <input
                type="number"
                value={frame?.mrp || ''}
                onChange={(e) => setFrame({ ...frame, brand: frame?.brand || 'LENSTRACK', mrp: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lens IT Code</label>
              <input
                type="text"
                value={lens?.itCode || ''}
                onChange={(e) => {
                  const selectedLens = sampleLenses.find(l => l.itCode === e.target.value);
                  if (selectedLens) {
                    setLens({
                      itCode: selectedLens.itCode,
                      price: selectedLens.price,
                      brandLine: selectedLens.brandLine,
                      yopoEligible: selectedLens.yopoEligible
                    });
                  } else {
                    setLens({ ...lens, itCode: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="D360ASV"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lens Price (₹)</label>
              <input
                type="number"
                value={lens?.price || ''}
                onChange={(e) => setLens({ ...lens, price: parseFloat(e.target.value) || 0, itCode: lens?.itCode || 'TEST', brandLine: lens?.brandLine || 'TEST' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Category</label>
              <select
                value={customerCategory || ''}
                onChange={(e) => setCustomerCategory(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">None</option>
                <option value="STUDENT">Student</option>
                <option value="DOCTOR">Doctor</option>
                <option value="TEACHER">Teacher</option>
                <option value="ARMED_FORCES">Armed Forces</option>
                <option value="SENIOR_CITIZEN">Senior Citizen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
              <input
                type="text"
                value={couponCode || ''}
                onChange={(e) => setCouponCode(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="WELCOME10"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <Button
              onClick={() => {
                setFrame({ brand: 'LENSTRACK', mrp: 2000 });
                setLens({ itCode: 'D360ASV', price: 4500, brandLine: 'DIGI360_ADVANCED', yopoEligible: true });
              }}
            >
              Load YOPO Example
            </Button>
            <Button
              onClick={() => {
                setFrame({ brand: 'LENSTRACK', mrp: 3000 });
                setLens({ itCode: 'BLUEXPERT', price: 999, brandLine: 'BLUEXPERT', yopoEligible: false });
              }}
            >
              Load FREE LENS Example
            </Button>
          </div>
        </div>

        {/* Upsell Banner - Placement Options */}
        {offerEngineResult?.upsell && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upsell Banner - Placement Options</h2>
            <div className="flex gap-4 mb-4">
              <Button
                variant={upsellPlacement === 'top' ? 'primary' : 'outline'}
                onClick={() => setUpsellPlacement('top')}
                size="sm"
              >
                Top Sticky
              </Button>
              <Button
                variant={upsellPlacement === 'bottom' ? 'primary' : 'outline'}
                onClick={() => setUpsellPlacement('bottom')}
                size="sm"
              >
                Bottom Sticky
              </Button>
              <Button
                variant={upsellPlacement === 'toast' ? 'primary' : 'outline'}
                onClick={() => setUpsellPlacement('toast')}
                size="sm"
              >
                Toast Popup
              </Button>
            </div>
            <UpsellBanner
              upsell={offerEngineResult.upsell}
              placement={upsellPlacement}
              onAddToCart={() => alert('Shop More clicked!')}
            />
          </div>
        )}

        {/* Applied Offers Display */}
        {offerEngineResult && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Applied Offers Display</h2>
            <AppliedOffersDisplay offersApplied={offerEngineResult.appliedOffers || offerEngineResult.offersApplied || []} />
          </div>
        )}

        {/* Order Summary */}
        {offerEngineResult && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <OrderSummary offerEngineResult={offerEngineResult} />
          </div>
        )}

        {/* Lens Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Lens Comparison</h2>
            <Button
              variant="outline"
              onClick={() => setShowLensComparison(!showLensComparison)}
              icon={<Eye className="h-4 w-4" />}
            >
              {showLensComparison ? 'Hide' : 'Show'} Comparison
            </Button>
          </div>
          {showLensComparison && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sampleLenses.map(lens => (
                <LensComparison key={lens.id} lens={lens} />
              ))}
            </div>
          )}
        </div>

        {/* Price Matrix */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Price Matrix</h2>
            <Button
              variant="outline"
              onClick={() => setShowPriceMatrix(!showPriceMatrix)}
              icon={<ShoppingCart className="h-4 w-4" />}
            >
              {showPriceMatrix ? 'Hide' : 'Show'} Matrix
            </Button>
          </div>
          {showPriceMatrix && (
            <PriceMatrix
              lenses={sampleLenses}
              onSelectLens={(selectedLens) => {
                setLens({
                  itCode: selectedLens.itCode,
                  price: selectedLens.price,
                  brandLine: selectedLens.brandLine,
                  yopoEligible: selectedLens.yopoEligible
                });
                setShowPriceMatrix(false);
              }}
            />
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Calculating offers...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OfferDemo() {
  return (
    <CartProvider>
      <OfferDemoContent />
    </CartProvider>
  );
}

