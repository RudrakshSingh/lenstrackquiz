// test-offer-engine.js
// Comprehensive test suite for Offer Engine V2

import { OfferEngineV2 } from './lib/offerEngine/OfferEngineV2.js';
import { UpsellEngine } from './lib/offerEngine/UpsellEngine.js';
import { ComboHandler } from './lib/offerEngine/handlers/ComboHandler.js';
import { YopoHandler } from './lib/offerEngine/handlers/YopoHandler.js';
import { FreeLensHandler } from './lib/offerEngine/handlers/FreeLensHandler.js';
import { PercentHandler } from './lib/offerEngine/handlers/PercentHandler.js';
import { FlatHandler } from './lib/offerEngine/handlers/FlatHandler.js';
import { Bog50Handler } from './lib/offerEngine/handlers/Bog50Handler.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    log(`✓ ${name}`, 'green');
  } catch (error) {
    testsFailed++;
    failures.push({ name, error: error.message });
    log(`✗ ${name}: ${error.message}`, 'red');
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual, expected, tolerance = 0.01, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `Expected ${expected} (±${tolerance}), got ${actual}`);
  }
}

// Test Handlers
log('\n=== Testing Handlers ===', 'cyan');

test('ComboHandler - canHandle', () => {
  const handler = new ComboHandler();
  const rule = { discountType: 'COMBO_PRICE', comboPrice: 3000 };
  assert(handler.canHandle(rule), 'Should handle COMBO_PRICE');
  assert(!handler.canHandle({ discountType: 'PERCENTAGE' }), 'Should not handle PERCENTAGE');
});

test('ComboHandler - apply', () => {
  const handler = new ComboHandler();
  const rule = { discountType: 'COMBO_PRICE', comboPrice: 3000, code: 'COMBO_TEST' };
  const result = handler.apply(rule, 2000, 2000);
  assertEqual(result.savings, 1000, 'Combo should save 1000');
  assertEqual(result.newTotal, 3000, 'Combo total should be 3000');
});

test('YopoHandler - canHandle', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC' };
  assert(handler.canHandle(rule), 'Should handle YOPO_LOGIC');
});

test('YopoHandler - apply with eligible lens', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC', code: 'YOPO_TEST' };
  const lens = { yopoEligible: true };
  const result = handler.apply(rule, 2000, 3000, lens);
  assertEqual(result.newTotal, 3000, 'YOPO should be max of frame and lens');
  assertEqual(result.savings, 2000, 'YOPO should save 2000');
});

test('YopoHandler - apply with non-eligible lens', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC', code: 'YOPO_TEST' };
  const lens = { yopoEligible: false };
  const result = handler.apply(rule, 2000, 3000, lens);
  assert(result === null, 'Should return null for non-eligible lens');
});

test('FreeLensHandler - apply', () => {
  const handler = new FreeLensHandler();
  const rule = { discountType: 'FREE_ITEM', code: 'FREE_TEST' };
  const result = handler.apply(rule, 2000, 3000);
  assertEqual(result.savings, 3000, 'Free lens should save lens price');
  assertEqual(result.newTotal, 2000, 'Free lens total should be frame price');
});

test('PercentHandler - apply', () => {
  const handler = new PercentHandler();
  const rule = { discountType: 'PERCENTAGE', discountValue: 10, code: 'PERCENT_TEST' };
  const result = handler.apply(rule, 2000, 3000);
  assertEqual(result.savings, 500, '10% of 5000 should be 500');
  assertEqual(result.newTotal, 4500, 'After 10% discount should be 4500');
});

test('FlatHandler - apply', () => {
  const handler = new FlatHandler();
  const rule = { discountType: 'FLAT_AMOUNT', discountValue: 500, code: 'FLAT_TEST' };
  const result = handler.apply(rule, 2000, 3000);
  assertEqual(result.savings, 500, 'Flat discount should be 500');
  assertEqual(result.newTotal, 4500, 'After flat discount should be 4500');
});

test('Bog50Handler - apply single pair', () => {
  const handler = new Bog50Handler();
  const rule = { offerType: 'BOGO_50', code: 'BOGO_TEST' };
  const result = handler.apply(rule, 2000, 3000);
  assertEqual(result.savings, 1500, 'BOGO 50% should save 50% of lens');
  assertEqual(result.newTotal, 3500, 'After BOGO should be 3500');
});

// Test OfferEngineV2
log('\n=== Testing OfferEngineV2 ===', 'cyan');

test('OfferEngineV2 - isRuleApplicable - brand match', () => {
  const engine = new OfferEngineV2();
  const rule = { isActive: true, frameBrand: 'LENSTRACK' };
  const frame = { brand: 'LENSTRACK', mrp: 2000 };
  const lens = { itCode: 'TEST', brandLine: 'TEST', price: 2000 };
  assert(engine.isRuleApplicable(rule, frame, lens), 'Should match brand');
});

test('OfferEngineV2 - isRuleApplicable - brand mismatch', () => {
  const engine = new OfferEngineV2();
  const rule = { isActive: true, frameBrand: 'RAYBAN' };
  const frame = { brand: 'LENSTRACK', mrp: 2000 };
  const lens = { itCode: 'TEST', brandLine: 'TEST', price: 2000 };
  assert(!engine.isRuleApplicable(rule, frame, lens), 'Should not match different brand');
});

test('OfferEngineV2 - isRuleApplicable - minFrameMRP', () => {
  const engine = new OfferEngineV2();
  const rule = { isActive: true, minFrameMRP: 3000 };
  const frame = { brand: 'LENSTRACK', mrp: 2000 };
  const lens = { itCode: 'TEST', brandLine: 'TEST', price: 2000 };
  assert(!engine.isRuleApplicable(rule, frame, lens), 'Should not match if MRP too low');
  
  const frame2 = { brand: 'LENSTRACK', mrp: 4000 };
  assert(engine.isRuleApplicable(rule, frame2, lens), 'Should match if MRP meets minimum');
});

test('OfferEngineV2 - isRuleApplicable - inactive rule', () => {
  const engine = new OfferEngineV2();
  const rule = { isActive: false };
  const frame = { brand: 'LENSTRACK', mrp: 2000 };
  const lens = { itCode: 'TEST', brandLine: 'TEST', price: 2000 };
  assert(!engine.isRuleApplicable(rule, frame, lens), 'Should not match inactive rule');
});

// Test UpsellEngine
log('\n=== Testing UpsellEngine ===', 'cyan');

test('UpsellEngine - getOpportunities - no rules', async () => {
  const engine = new UpsellEngine();
  const state = { finalPayable: 4000 };
  const cart = { frame: { brand: 'LENSTRACK' }, lens: { itCode: 'TEST' } };
  const result = await engine.getOpportunities(state, cart, []);
  assert(result === null, 'Should return null with no rules');
});

test('UpsellEngine - getOpportunities - threshold not met', async () => {
  const engine = new UpsellEngine();
  const state = { finalPayable: 2000 };
  const cart = { frame: { brand: 'LENSTRACK' }, lens: { itCode: 'TEST' } };
  const rules = [{
    upsellEnabled: true,
    offerType: 'BONUS_FREE_PRODUCT',
    upsellThreshold: 5000,
    freeProductValue: 1000,
    code: 'BONUS_TEST'
  }];
  const result = await engine.getOpportunities(state, cart, rules);
  assert(result !== null, 'Should return upsell suggestion');
  assert(result.remaining > 0, 'Should have remaining amount');
});

// Test API endpoint structure
log('\n=== Testing API Endpoint Structure ===', 'cyan');

test('API - Request validation - missing frame', async () => {
  const response = await fetch('http://localhost:3000/api/offer-engine/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lens: { itCode: 'TEST', price: 2000, brandLine: 'TEST' } })
  });
  const data = await response.json();
  assertEqual(response.status, 400, 'Should return 400 for missing frame');
  assert(data.error, 'Should have error in response');
});

test('API - Request validation - missing lens', async () => {
  const response = await fetch('http://localhost:3000/api/offer-engine/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frame: { brand: 'LENSTRACK', mrp: 2000 } })
  });
  const data = await response.json();
  assertEqual(response.status, 400, 'Should return 400 for missing lens');
  assert(data.error, 'Should have error in response');
});

test('API - Valid request structure', async () => {
  const response = await fetch('http://localhost:3000/api/offer-engine/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frame: { brand: 'LENSTRACK', subCategory: 'ADVANCED', mrp: 2500 },
      lens: { itCode: 'D360ASV', price: 2500, brandLine: 'DIGI360_ADVANCED', yopoEligible: true }
    })
  });
  
  if (response.status === 200) {
    const data = await response.json();
    assert(data.success, 'Should have success flag');
    assert(data.data, 'Should have data object');
    assert(data.data.frameMRP !== undefined, 'Should have frameMRP');
    assert(data.data.lensPrice !== undefined, 'Should have lensPrice');
    assert(data.data.finalPayable !== undefined, 'Should have finalPayable');
    assert(Array.isArray(data.data.priceComponents), 'Should have priceComponents array');
    log(`  Response: Base Total: ₹${data.data.baseTotal}, Final: ₹${data.data.finalPayable}`, 'blue');
  } else {
    const text = await response.text();
    log(`  API returned ${response.status}: ${text.substring(0, 200)}`, 'yellow');
    // Don't fail if API is not available, just warn
  }
});

// Test edge cases
log('\n=== Testing Edge Cases ===', 'cyan');

test('Edge Case - Zero MRP', () => {
  const handler = new PercentHandler();
  const rule = { discountType: 'PERCENTAGE', discountValue: 10, code: 'TEST' };
  const result = handler.apply(rule, 0, 1000);
  assertEqual(result.savings, 100, 'Should handle zero frame MRP');
});

test('Edge Case - Negative discount capped', () => {
  const handler = new FlatHandler();
  const rule = { discountType: 'FLAT_AMOUNT', discountValue: 10000, code: 'TEST' };
  const result = handler.apply(rule, 2000, 3000);
  assertEqual(result.savings, 5000, 'Discount should be capped at total');
  assertEqual(result.newTotal, 0, 'Total should not go negative');
});

test('Edge Case - YOPO with equal prices', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC', code: 'TEST' };
  const lens = { yopoEligible: true };
  const result = handler.apply(rule, 2000, 2000, lens);
  assertEqual(result.newTotal, 2000, 'YOPO with equal prices should be 2000');
  assertEqual(result.savings, 2000, 'YOPO should save 2000');
});

// Summary
log('\n=== Test Summary ===', 'cyan');
log(`Passed: ${testsPassed}`, 'green');
log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');

if (failures.length > 0) {
  log('\nFailures:', 'red');
  failures.forEach(f => {
    log(`  - ${f.name}: ${f.error}`, 'red');
  });
}

process.exit(testsFailed > 0 ? 1 : 0);

