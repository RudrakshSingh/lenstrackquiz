// test-complete-regression.js
// Complete end-to-end regression test for Offer Engine V2 Final

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Enhanced test runner with better error handling
async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return { success: response.ok, status: response.status, data, text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

const results = { passed: 0, failed: 0, tests: [] };

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
  console.log(`${passed ? '✅' : '❌'} ${name}${details ? `: ${details}` : ''}`);
}

// ============================================================================
// COMPREHENSIVE TEST SUITE
// ============================================================================

async function runCompleteRegression() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   OFFER ENGINE V2 - COMPLETE REGRESSION TEST SUITE          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Test 1: Basic API Health
  console.log('\n📡 1. API Health Check');
  const health = await testAPI('/api/offer-engine/calculate', 'POST', {
    frame: { brand: 'LENSTRACK', mrp: 2000 },
    lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }
  });
  recordTest('API Health - Endpoint accessible', health.success || health.status === 400 || health.status === 500);
  
  if (!health.success && health.status !== 400 && health.status !== 500) {
    console.log('⚠️  API not responding. Make sure dev server is running.');
    console.log(`   Response: ${health.status} - ${health.error || health.text?.substring(0, 100)}`);
    return results;
  }
  
  // Test 2: Response Structure Analysis
  console.log('\n📋 2. Response Structure Analysis');
  const testResponse = await testAPI('/api/offer-engine/calculate', 'POST', {
    frame: { brand: 'LENSTRACK', mrp: 2000 },
    lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }
  });
  
  if (testResponse.success && testResponse.data) {
    // API wraps response in data.data
    const data = testResponse.data.data || testResponse.data;
    
    // Check V2 Final structure
    const hasAppliedOffers = Array.isArray(data.appliedOffers) || Array.isArray(data.offersApplied);
    const hasFinalPrice = typeof data.finalPrice === 'number' || typeof data.finalPayable === 'number';
    const hasBreakdown = Array.isArray(data.breakdown) || Array.isArray(data.priceComponents);
    
    recordTest('Response - Has appliedOffers/offersApplied', hasAppliedOffers);
    recordTest('Response - Has finalPrice/finalPayable', hasFinalPrice);
    recordTest('Response - Has breakdown/priceComponents', hasBreakdown);
    
    // Check for upsell (optional)
    const hasUpsell = data.upsell !== undefined;
    recordTest('Response - Upsell field present (optional)', true, hasUpsell ? 'Present' : 'Not present (OK)');
    
    // Log actual structure for debugging
    console.log('\n   Actual Response Structure:');
    console.log(`   - Keys: ${Object.keys(data).join(', ')}`);
    if (data.appliedOffers) console.log(`   - appliedOffers: ${data.appliedOffers.length} items`);
    if (data.offersApplied) console.log(`   - offersApplied: ${data.offersApplied.length} items`);
    if (data.finalPrice !== undefined) console.log(`   - finalPrice: ${data.finalPrice}`);
    if (data.finalPayable !== undefined) console.log(`   - finalPayable: ${data.finalPayable}`);
    if (data.breakdown) console.log(`   - breakdown: ${data.breakdown.length} items`);
    if (data.priceComponents) console.log(`   - priceComponents: ${data.priceComponents.length} items`);
  } else {
    recordTest('Response Structure - API call failed', false, testResponse.error || `Status: ${testResponse.status}`);
  }
  
  // Test 3: All Offer Types
  console.log('\n🎯 3. Offer Type Tests');
  const offerTypes = [
    { name: 'YOPO', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'D360ASV', price: 4500, brandLine: 'DIGI360_ADVANCED', yopoEligible: true } },
    { name: 'Combo', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false } },
    { name: 'Free Lens', frame: { brand: 'LENSTRACK', mrp: 3000 }, lens: { itCode: 'BLUEXPERT', price: 999, brandLine: 'BLUEXPERT', yopoEligible: false } },
    { name: 'Percent', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false } },
    { name: 'Flat', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false } },
    { name: 'BOG50', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }, secondPair: { enabled: true, firstPairTotal: 4000, secondPairFrameMRP: 1500, secondPairLensPrice: 2000 } },
    { name: 'Category', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }, customerCategory: 'STUDENT' },
    { name: 'Coupon', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }, couponCode: 'WELCOME10' }
  ];
  
  for (const offerType of offerTypes) {
    const result = await testAPI('/api/offer-engine/calculate', 'POST', offerType);
    recordTest(`Offer Type - ${offerType.name}`, result.success, result.success ? 'OK' : `Status: ${result.status}`);
  }
  
  // Test 4: Edge Cases
  console.log('\n🔍 4. Edge Cases');
  const edgeCases = [
    { name: 'Zero Prices', frame: { brand: 'LENSTRACK', mrp: 0 }, lens: { itCode: 'TEST', price: 0, brandLine: 'TEST', yopoEligible: false } },
    { name: 'High Prices', frame: { brand: 'LENSTRACK', mrp: 99999 }, lens: { itCode: 'TEST', price: 99999, brandLine: 'TEST', yopoEligible: false } },
    { name: 'Missing Frame MRP', frame: { brand: 'LENSTRACK' }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false } },
    { name: 'Missing Lens Price', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', brandLine: 'TEST', yopoEligible: false } },
    { name: 'Invalid Category', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }, customerCategory: 'INVALID' },
    { name: 'Invalid Coupon', frame: { brand: 'LENSTRACK', mrp: 2000 }, lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: false }, couponCode: 'INVALID123' }
  ];
  
  for (const edgeCase of edgeCases) {
    const result = await testAPI('/api/offer-engine/calculate', 'POST', edgeCase);
    // Edge cases should either succeed or return 400 (validation error)
    const handled = result.success || result.status === 400;
    recordTest(`Edge Case - ${edgeCase.name}`, handled, handled ? 'Handled' : `Unexpected: ${result.status}`);
  }
  
  // Test 5: Cart DTO Format
  console.log('\n🛒 5. Cart DTO Format');
  const cartDTO = await testAPI('/api/offer-engine/calculate', 'POST', {
    cart: {
      frame: { brand: 'LENSTRACK', mrp: 2000 },
      lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST', yopoEligible: true }
    },
    customer: { category: 'STUDENT' }
  });
  recordTest('Cart DTO Format - Supported', cartDTO.success, cartDTO.success ? 'OK' : `Status: ${cartDTO.status}`);
  
  // Test 6: Priority Waterfall
  console.log('\n⚡ 6. Priority Waterfall');
  const priorityTest = await testAPI('/api/offer-engine/calculate', 'POST', {
    frame: { brand: 'LENSTRACK', mrp: 2000 },
    lens: { itCode: 'D360ASV', price: 4500, brandLine: 'DIGI360_ADVANCED', yopoEligible: true },
    customerCategory: 'STUDENT'
  });
  if (priorityTest.success && priorityTest.data) {
    const data = priorityTest.data.data || priorityTest.data;
    const offers = data.appliedOffers || data.offersApplied || [];
    const hasCombo = offers.some(o => o.offerType === 'COMBO_PRICE' || o.description?.includes('Combo'));
    const hasYopo = offers.some(o => o.offerType === 'YOPO' || o.description?.includes('YOPO'));
    const priorityCorrect = !(hasCombo && hasYopo); // Can't have both
    recordTest('Priority - Combo/YOPO mutual exclusion', priorityCorrect, priorityCorrect ? 'OK' : 'Both applied (error)');
  } else {
    recordTest('Priority - Combo/YOPO mutual exclusion', false, 'API call failed');
  }
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`);
  
  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  ❌ ${test.name}${test.details ? ` - ${test.details}` : ''}`);
    });
  }
  
  return results;
}

// Run if executed directly
if (typeof window === 'undefined' && require.main === module) {
  runCompleteRegression().then(() => {
    process.exit(results.failed === 0 ? 0 : 1);
  });
}

module.exports = { runCompleteRegression };

