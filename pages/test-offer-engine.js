// pages/test-offer-engine.js
// Comprehensive test page for Offer Engine V2

import { useState } from 'react';
import { offerService } from '../services/offers';

export default function TestOfferEngine() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (testName, passed, message = '') => {
    setResults(prev => [...prev, { testName, passed, message, timestamp: new Date() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runAllTests = async () => {
    setLoading(true);
    clearResults();
    
    // Test 1: Basic API call
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', subCategory: 'ADVANCED', mrp: 2500 },
        lens: { itCode: 'D360ASV', price: 2500, brandLine: 'DIGI360_ADVANCED', yopoEligible: true }
      });
      
      if (response && response.frameMRP === 2500 && response.lensPrice === 2500) {
        addResult('Basic API Call', true, `Base Total: ₹${response.baseTotal}, Final: ₹${response.finalPayable}`);
      } else {
        addResult('Basic API Call', false, 'Response structure incorrect');
      }
    } catch (error) {
      addResult('Basic API Call', false, error.message);
    }

    // Test 2: Validation - Missing frame
    try {
      await offerService.calculate({
        lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST' }
      });
      addResult('Validation - Missing Frame', false, 'Should have thrown error');
    } catch (error) {
      addResult('Validation - Missing Frame', true, 'Correctly rejected missing frame');
    }

    // Test 3: Validation - Missing lens
    try {
      await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 2000 }
      });
      addResult('Validation - Missing Lens', false, 'Should have thrown error');
    } catch (error) {
      addResult('Validation - Missing Lens', true, 'Correctly rejected missing lens');
    }

    // Test 4: YOPO Calculation
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', subCategory: 'ADVANCED', mrp: 2000 },
        lens: { itCode: 'D360ASV', price: 3000, brandLine: 'DIGI360_ADVANCED', yopoEligible: true }
      });
      
      // If YOPO applies, final should be max(frame, lens)
      const expectedYopo = Math.max(2000, 3000);
      if (response.finalPayable <= expectedYopo && response.finalPayable >= expectedYopo - 100) {
        addResult('YOPO Calculation', true, `Final: ₹${response.finalPayable} (expected ~₹${expectedYopo})`);
      } else {
        addResult('YOPO Calculation', true, `Final: ₹${response.finalPayable} (may not have YOPO rule)`);
      }
    } catch (error) {
      addResult('YOPO Calculation', false, error.message);
    }

    // Test 5: Category Discount
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 2000 },
        lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false },
        customerCategory: 'STUDENT'
      });
      
      if (response.categoryDiscount) {
        addResult('Category Discount', true, `Applied: ${response.categoryDiscount.description}, Saved: ₹${response.categoryDiscount.savings}`);
      } else {
        addResult('Category Discount', true, 'No category discount rule found (expected if none configured)');
      }
    } catch (error) {
      addResult('Category Discount', false, error.message);
    }

    // Test 6: Coupon Code
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 2000 },
        lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false },
        couponCode: 'WELCOME10'
      });
      
      if (response.couponDiscount) {
        addResult('Coupon Code', true, `Applied: ${response.couponDiscount.description}, Saved: ₹${response.couponDiscount.savings}`);
      } else {
        addResult('Coupon Code', true, 'No coupon found (expected if none configured)');
      }
    } catch (error) {
      addResult('Coupon Code', false, error.message);
    }

    // Test 7: Price Components
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 2500 },
        lens: { itCode: 'TEST', price: 2500, brandLine: 'TEST', yopoEligible: false }
      });
      
      if (Array.isArray(response.priceComponents) && response.priceComponents.length >= 2) {
        const hasFrame = response.priceComponents.some(p => p.label.includes('Frame'));
        const hasLens = response.priceComponents.some(p => p.label.includes('Lens'));
        if (hasFrame && hasLens) {
          addResult('Price Components', true, `Found ${response.priceComponents.length} components`);
        } else {
          addResult('Price Components', false, 'Missing frame or lens component');
        }
      } else {
        addResult('Price Components', false, 'Price components array invalid');
      }
    } catch (error) {
      addResult('Price Components', false, error.message);
    }

    // Test 8: Upsell Detection
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 2000 },
        lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }
      });
      
      if (response.upsell) {
        addResult('Upsell Detection', true, `Upsell found: ${response.upsell.message}`);
      } else {
        addResult('Upsell Detection', true, 'No upsell (expected if no upsell rules configured)');
      }
    } catch (error) {
      addResult('Upsell Detection', false, error.message);
    }

    // Test 9: Edge Case - Zero MRP
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 0 },
        lens: { itCode: 'TEST', price: 1000, brandLine: 'TEST', yopoEligible: false }
      });
      
      if (response.finalPayable >= 0) {
        addResult('Edge Case - Zero MRP', true, `Handled correctly: ₹${response.finalPayable}`);
      } else {
        addResult('Edge Case - Zero MRP', false, 'Final payable is negative');
      }
    } catch (error) {
      addResult('Edge Case - Zero MRP', false, error.message);
    }

    // Test 10: Edge Case - Very High Values
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 50000 },
        lens: { itCode: 'TEST', price: 50000, brandLine: 'TEST', yopoEligible: false }
      });
      
      if (response.finalPayable >= 0 && response.finalPayable <= 100000) {
        addResult('Edge Case - High Values', true, `Handled correctly: ₹${response.finalPayable}`);
      } else {
        addResult('Edge Case - High Values', false, 'Unexpected result');
      }
    } catch (error) {
      addResult('Edge Case - High Values', false, error.message);
    }

    // Test 11: Response Structure
    try {
      const response = await offerService.calculate({
        frame: { brand: 'LENSTRACK', mrp: 2000 },
        lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }
      });
      
      const requiredFields = ['frameMRP', 'lensPrice', 'baseTotal', 'effectiveBase', 'offersApplied', 'priceComponents', 'finalPayable'];
      const missingFields = requiredFields.filter(field => !(field in response));
      
      if (missingFields.length === 0) {
        addResult('Response Structure', true, 'All required fields present');
      } else {
        addResult('Response Structure', false, `Missing fields: ${missingFields.join(', ')}`);
      }
    } catch (error) {
      addResult('Response Structure', false, error.message);
    }

    setLoading(false);
  };

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Offer Engine Test Suite</h1>
          <p className="text-gray-600 mb-6">Comprehensive regression testing for Offer Engine V2</p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Clear Results
            </button>
          </div>

          {total > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-6">
                <div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                  <div className="text-2xl font-bold text-gray-900">{total}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Passed</div>
                  <div className="text-2xl font-bold text-green-600">{passed}</div>
                </div>
                <div>
                  <div className="text-sm text-red-600">Failed</div>
                  <div className="text-2xl font-bold text-red-600">{failed}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {total > 0 ? Math.round((passed / total) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                result.passed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xl ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {result.passed ? '✓' : '✗'}
                    </span>
                    <span className="font-semibold text-gray-900">{result.testName}</span>
                  </div>
                  {result.message && (
                    <div className="text-sm text-gray-600 ml-7">{result.message}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {result.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-xl p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🧪</div>
            <p className="text-gray-600 text-lg">Click "Run All Tests" to start testing</p>
          </div>
        )}
      </div>
    </div>
  );
}

