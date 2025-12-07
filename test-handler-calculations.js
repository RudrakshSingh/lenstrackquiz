// test-handler-calculations.js
// Test handler calculations directly with mock rules

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

let tests = 0;
let passed = 0;
let failed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  tests++;
  try {
    const result = fn();
    if (result === false) {
      failed++;
      log(`✗ ${name}`, 'red');
      return false;
    }
    passed++;
    log(`✓ ${name}`, 'green');
    return true;
  } catch (error) {
    failed++;
    log(`✗ ${name}: ${error.message}`, 'red');
    return false;
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

// Test Suite
log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
log('║        HANDLER CALCULATION TESTS - DIRECT LOGIC TEST         ║', 'cyan');
log('╚══════════════════════════════════════════════════════════════╝', 'cyan');

// ============================================
// COMBO HANDLER TESTS
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('COMBO HANDLER TESTS', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

test('ComboHandler - Can handle COMBO_PRICE', () => {
  const handler = new ComboHandler();
  const rule = { discountType: 'COMBO_PRICE', comboPrice: 3000 };
  assert(handler.canHandle(rule), 'Should handle COMBO_PRICE');
  assert(!handler.canHandle({ discountType: 'PERCENTAGE' }), 'Should not handle PERCENTAGE');
  return true;
});

test('ComboHandler - Calculate combo price savings', () => {
  const handler = new ComboHandler();
  const rule = { discountType: 'COMBO_PRICE', comboPrice: 3000, code: 'COMBO_TEST' };
  const result = handler.apply(rule, 2000, 2000);
  
  assertEqual(result.newTotal, 3000, 'Combo total should be 3000');
  assertEqual(result.savings, 1000, 'Should save 1000 (4000 - 3000)');
  assertEqual(result.offerType, 'COMBO_PRICE', 'Should have correct offer type');
  return true;
});

test('ComboHandler - Combo price higher than base (no savings)', () => {
  const handler = new ComboHandler();
  const rule = { discountType: 'COMBO_PRICE', comboPrice: 5000, code: 'COMBO_TEST' };
  const result = handler.apply(rule, 2000, 2000);
  
  assertEqual(result.newTotal, 5000, 'Combo total should be 5000');
  assertEqual(result.savings, 0, 'Should have no savings if combo is higher');
  return true;
});

// ============================================
// YOPO HANDLER TESTS
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('YOPO HANDLER TESTS', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

test('YopoHandler - Can handle YOPO_LOGIC', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC' };
  assert(handler.canHandle(rule), 'Should handle YOPO_LOGIC');
  return true;
});

test('YopoHandler - Lens higher than frame', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC', code: 'YOPO_TEST' };
  const lens = { yopoEligible: true };
  const result = handler.apply(rule, 2000, 4500, lens);
  
  assertEqual(result.newTotal, 4500, 'Should pay higher (lens price)');
  assertEqual(result.savings, 2000, 'Should save frame price');
  return true;
});

test('YopoHandler - Frame higher than lens', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC', code: 'YOPO_TEST' };
  const lens = { yopoEligible: true };
  const result = handler.apply(rule, 5000, 3000, lens);
  
  assertEqual(result.newTotal, 5000, 'Should pay higher (frame price)');
  assertEqual(result.savings, 3000, 'Should save lens price');
  return true;
});

test('YopoHandler - Equal prices', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC', code: 'YOPO_TEST' };
  const lens = { yopoEligible: true };
  const result = handler.apply(rule, 2500, 2500, lens);
  
  assertEqual(result.newTotal, 2500, 'Should pay equal price');
  assertEqual(result.savings, 2500, 'Should save one item price');
  return true;
});

test('YopoHandler - Non-eligible lens returns null', () => {
  const handler = new YopoHandler();
  const rule = { discountType: 'YOPO_LOGIC', code: 'YOPO_TEST' };
  const lens = { yopoEligible: false };
  const result = handler.apply(rule, 2000, 3000, lens);
  
  assert(result === null, 'Should return null for non-eligible lens');
  return true;
});

// ============================================
// FREE LENS HANDLER TESTS
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('FREE LENS HANDLER TESTS', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

test('FreeLensHandler - Can handle FREE_ITEM', () => {
  const handler = new FreeLensHandler();
  const rule = { discountType: 'FREE_ITEM' };
  assert(handler.canHandle(rule), 'Should handle FREE_ITEM');
  return true;
});

test('FreeLensHandler - Free lens calculation', () => {
  const handler = new FreeLensHandler();
  const rule = { discountType: 'FREE_ITEM', code: 'FREE_TEST' };
  const lens = { itCode: 'TEST' };
  const result = handler.apply(rule, 3000, 999, lens);
  
  assertEqual(result.newTotal, 3000, 'Should pay only frame price');
  assertEqual(result.savings, 999, 'Should save lens price');
  return true;
});

test('FreeLensHandler - Value cap 40% - Lens under cap', () => {
  const handler = new FreeLensHandler();
  const rule = {
    discountType: 'FREE_ITEM',
    code: 'FREE_TEST',
    config: JSON.stringify({ valueCapPercent: 40 })
  };
  const lens = { itCode: 'BLUEXPERT' };
  const result = handler.apply(rule, 3000, 999, lens);
  
  // Frame: ₹3000, 40% = ₹1200
  // Lens: ₹999 (under cap) → FREE
  assertEqual(result.newTotal, 3000, 'Should pay only frame price');
  assertEqual(result.savings, 999, 'Should save full lens price');
  return true;
});

test('FreeLensHandler - Value cap 40% - Lens exceeds cap', () => {
  const handler = new FreeLensHandler();
  const rule = {
    discountType: 'FREE_ITEM',
    code: 'FREE_TEST',
    config: JSON.stringify({ valueCapPercent: 40 })
  };
  const lens = { itCode: 'PREMIUM' };
  const result = handler.apply(rule, 3000, 2000, lens);
  
  // Frame: ₹3000, 40% = ₹1200
  // Lens: ₹2000 (exceeds cap) → Customer pays difference (2000 - 1200 = 800)
  // Final: 3000 + 800 = 3800
  assertEqual(result.newTotal, 3800, 'Should pay frame + difference');
  assertEqual(result.savings, 1200, 'Should save only up to cap');
  return true;
});

// ============================================
// PERCENT HANDLER TESTS
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('PERCENT HANDLER TESTS', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

test('PercentHandler - Can handle PERCENTAGE', () => {
  const handler = new PercentHandler();
  const rule = { discountType: 'PERCENTAGE', discountValue: 10 };
  assert(handler.canHandle(rule), 'Should handle PERCENTAGE');
  return true;
});

test('PercentHandler - 10% discount', () => {
  const handler = new PercentHandler();
  const rule = { discountType: 'PERCENTAGE', discountValue: 10, code: 'PERCENT_TEST' };
  const result = handler.apply(rule, 2000, 3000);
  
  // Base: 5000, 10% = 500
  assertEqual(result.newTotal, 4500, 'Should be 4500 after 10% discount');
  assertEqual(result.savings, 500, 'Should save 500');
  return true;
});

test('PercentHandler - 20% discount', () => {
  const handler = new PercentHandler();
  const rule = { discountType: 'PERCENTAGE', discountValue: 20, code: 'PERCENT_TEST' };
  const result = handler.apply(rule, 2500, 2500);
  
  // Base: 5000, 20% = 1000
  assertEqual(result.newTotal, 4000, 'Should be 4000 after 20% discount');
  assertEqual(result.savings, 1000, 'Should save 1000');
  return true;
});

// ============================================
// FLAT HANDLER TESTS
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('FLAT HANDLER TESTS', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

test('FlatHandler - Can handle FLAT_AMOUNT', () => {
  const handler = new FlatHandler();
  const rule = { discountType: 'FLAT_AMOUNT', discountValue: 500 };
  assert(handler.canHandle(rule), 'Should handle FLAT_AMOUNT');
  return true;
});

test('FlatHandler - ₹500 off', () => {
  const handler = new FlatHandler();
  const rule = { discountType: 'FLAT_AMOUNT', discountValue: 500, code: 'FLAT_TEST' };
  const result = handler.apply(rule, 2000, 3000);
  
  // Base: 5000, Flat: 500
  assertEqual(result.newTotal, 4500, 'Should be 4500 after ₹500 off');
  assertEqual(result.savings, 500, 'Should save 500');
  return true;
});

test('FlatHandler - Discount capped at total', () => {
  const handler = new FlatHandler();
  const rule = { discountType: 'FLAT_AMOUNT', discountValue: 10000, code: 'FLAT_TEST' };
  const result = handler.apply(rule, 1000, 500);
  
  // Base: 1500, Flat: 10000 (should cap at 1500)
  assertEqual(result.newTotal, 0, 'Should be 0 (capped at total)');
  assertEqual(result.savings, 1500, 'Should save only up to total');
  return true;
});

// ============================================
// BOG50 HANDLER TESTS
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('BOG50 HANDLER TESTS', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

test('Bog50Handler - Can handle BOGO_50', () => {
  const handler = new Bog50Handler();
  const rule = { offerType: 'BOGO_50' };
  assert(handler.canHandle(rule), 'Should handle BOGO_50');
  return true;
});

test('Bog50Handler - Single pair 50% off lens', () => {
  const handler = new Bog50Handler();
  const rule = { offerType: 'BOGO_50', code: 'BOGO_TEST' };
  const result = handler.apply(rule, 2000, 2000);
  
  // Base: 4000, 50% off lens: 1000
  assertEqual(result.newTotal, 3000, 'Should be 3000 (2000 + 1000)');
  assertEqual(result.savings, 1000, 'Should save 1000 (50% of lens)');
  return true;
});

test('Bog50Handler - Second pair scenario', () => {
  const handler = new Bog50Handler();
  const rule = { offerType: 'BOGO_50', code: 'BOGO_TEST' };
  const secondPair = {
    enabled: true,
    firstPairTotal: 2500, // 1500 + 1000
    secondPairFrameMRP: 1200,
    secondPairLensPrice: 800
  };
  const result = handler.apply(rule, 1500, 1000, null, secondPair);
  
  // First: 2500, Second: 2000
  // Lower: 2000, 50% = 1000
  // Final: 2500 + 2000 - 1000 = 3500
  assertEqual(result.newTotal, 3500, 'Should be 3500');
  assertEqual(result.savings, 1000, 'Should save 1000 (50% of lower pair)');
  return true;
});

// ============================================
// PRIORITY ORDER TESTS
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('PRIORITY ORDER TESTS', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

test('Priority - ComboHandler has highest priority (1)', () => {
  const handler = new ComboHandler();
  assertEqual(handler.priority, 1, 'ComboHandler should have priority 1');
  return true;
});

test('Priority - YopoHandler has priority 2', () => {
  const handler = new YopoHandler();
  assertEqual(handler.priority, 2, 'YopoHandler should have priority 2');
  return true;
});

test('Priority - FreeLensHandler has priority 3', () => {
  const handler = new FreeLensHandler();
  assertEqual(handler.priority, 3, 'FreeLensHandler should have priority 3');
  return true;
});

test('Priority - PercentHandler has priority 4', () => {
  const handler = new PercentHandler();
  assertEqual(handler.priority, 4, 'PercentHandler should have priority 4');
  return true;
});

test('Priority - FlatHandler has priority 5', () => {
  const handler = new FlatHandler();
  assertEqual(handler.priority, 5, 'FlatHandler should have priority 5');
  return true;
});

test('Priority - Bog50Handler has priority 6', () => {
  const handler = new Bog50Handler();
  assertEqual(handler.priority, 6, 'Bog50Handler should have priority 6');
  return true;
});

// ============================================
// SUMMARY
// ============================================
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('TEST SUMMARY', 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

log(`\nTotal Tests: ${tests}`, 'blue');
log(`Passed: ${passed}`, 'green');
log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
log(`Success Rate: ${Math.round((passed / tests) * 100)}%`, 
    passed === tests ? 'green' : 'yellow');

log('\n' + '='.repeat(60), 'cyan');
if (passed === tests) {
  log('✅ ALL HANDLER CALCULATIONS CORRECT!', 'green');
} else {
  log('⚠️  SOME TESTS FAILED', 'yellow');
}
log('='.repeat(60) + '\n', 'cyan');

process.exit(failed > 0 ? 1 : 0);

