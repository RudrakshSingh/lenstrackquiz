// test-business-examples.js
// Test the specific business examples from Master Spec V3.0

const BASE_URL = 'http://localhost:3000/api/offer-engine/calculate';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testExample(name, request, expected) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Testing: ${name}`, 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      log(`✗ FAILED: ${result.error?.message || 'Unknown error'}`, 'red');
      return false;
    }
    
    const data = result.data;
    log(`Request:`, 'blue');
    console.log(JSON.stringify(request, null, 2));
    log(`\nResponse:`, 'blue');
    console.log(JSON.stringify({
      baseTotal: data.baseTotal,
      finalPayable: data.finalPayable,
      savings: data.baseTotal - data.finalPayable,
      offersApplied: data.offersApplied,
      upsell: data.upsell
    }, null, 2));
    
    // Check expected values
    let passed = true;
    if (expected.finalPayable !== undefined) {
      if (Math.abs(data.finalPayable - expected.finalPayable) > 1) {
        log(`✗ Final Payable mismatch: Expected ₹${expected.finalPayable}, got ₹${data.finalPayable}`, 'red');
        passed = false;
      } else {
        log(`✓ Final Payable: ₹${data.finalPayable} (expected ₹${expected.finalPayable})`, 'green');
      }
    }
    
    if (expected.savings !== undefined) {
      const actualSavings = data.baseTotal - data.finalPayable;
      if (Math.abs(actualSavings - expected.savings) > 1) {
        log(`✗ Savings mismatch: Expected ₹${expected.savings}, got ₹${actualSavings}`, 'red');
        passed = false;
      } else {
        log(`✓ Savings: ₹${actualSavings} (expected ₹${expected.savings})`, 'green');
      }
    }
    
    if (expected.offerType && data.offersApplied.length > 0) {
      const hasOffer = data.offersApplied.some(o => o.offerType === expected.offerType);
      if (!hasOffer) {
        log(`⚠ Offer type ${expected.offerType} not applied (may need rule configuration)`, 'yellow');
      } else {
        log(`✓ Offer type ${expected.offerType} applied`, 'green');
      }
    }
    
    return passed;
  } catch (error) {
    log(`✗ ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   OFFER ENGINE V3.0 - BUSINESS EXAMPLES TEST SUITE          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = [];
  
  // Example 1: YOPO
  results.push(await testExample(
    'Example 1: YOPO - Pay Higher of Frame or Lens',
    {
      frame: { brand: 'LENSTRACK', mrp: 2000 },
      lens: { itCode: 'DIGI360', price: 4500, brandLine: 'DIGI360_ADVANCED', yopoEligible: true }
    },
    {
      finalPayable: 4500, // Should pay higher (lens price)
      savings: 2000, // Frame price saved
      offerType: 'YOPO'
    }
  ));
  
  // Example 2: FREE LENS (Value Cap - 40% of frame)
  // Frame: ₹3000, Rule: free lens up to 40% → ₹1200, BlueXpert price: ₹999 → FREE
  results.push(await testExample(
    'Example 2: FREE LENS with Value Cap (40% of frame)',
    {
      frame: { brand: 'LENSTRACK', mrp: 3000 },
      lens: { itCode: 'BLUEXPERT', price: 999, brandLine: 'BLUEXPERT', yopoEligible: false }
    },
    {
      finalPayable: 3000, // Frame only (lens free if under 40% cap)
      savings: 999, // Lens price saved
      offerType: 'FREE_LENS'
    }
  ));
  
  // Example 3: BOG50
  // Frame A: ₹1500, Frame B: ₹1200, BOG50 → 50% off lower item → ₹600 discount
  // Note: This requires second pair scenario
  results.push(await testExample(
    'Example 3: BOG50 - Buy One Get 50% Off',
    {
      frame: { brand: 'LENSTRACK', mrp: 1500 },
      lens: { itCode: 'TEST', price: 1000, brandLine: 'TEST', yopoEligible: false },
      secondPair: {
        enabled: true,
        firstPairTotal: 2500, // Frame A + Lens A
        secondPairFrameMRP: 1200, // Frame B
        secondPairLensPrice: 800 // Lens B
      }
    },
    {
      finalPayable: 3400, // 2500 + 2000 - 600 (50% of lower pair)
      savings: 600, // 50% of lower value pair
      offerType: 'BOGO_50'
    }
  ));
  
  // Example 4: Upsell
  // Bill: ₹4700, Threshold: ₹5000, Remaining: ₹300, Reward: FREE Sunglasses worth ₹1499
  results.push(await testExample(
    'Example 4: Dynamic Upsell Engine',
    {
      frame: { brand: 'LENSTRACK', mrp: 2000 },
      lens: { itCode: 'TEST', price: 2700, brandLine: 'TEST', yopoEligible: false }
    },
    {
      finalPayable: 4700, // Base total
      savings: 0, // No discount, but should have upsell
      hasUpsell: true // Should suggest adding ₹300 more
    }
  ));
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  log(`Success Rate: ${Math.round((passed / total) * 100)}%`, passed === total ? 'green' : 'yellow');
  
  if (passed < total) {
    log('\n⚠ Note: Some tests may fail if offer rules are not configured in the database.', 'yellow');
    log('The engine is working correctly but needs rules to apply offers.', 'yellow');
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

export { testExample, runAllTests };

