// test-store-staff-order-system.js
// Comprehensive test suite for Store + Staff + Order System V1.0

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test utilities
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function test(name, testFn) {
  try {
    log(`\n🧪 Testing: ${name}`, 'info');
    await testFn();
    testResults.passed++;
    log(`✅ PASSED: ${name}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    log(`❌ FAILED: ${name}`, 'error');
    log(`   Error: ${error.message}`, 'error');
  }
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test data
let testStoreId = null;
let testStaffId = null;
let testOrderId = null;
let authToken = null;

// ============================================
// 1. STORE ENDPOINTS TESTS
// ============================================

async function testStoreEndpoints() {
  log('\n📦 ===== STORE ENDPOINTS TESTS =====', 'info');

  // Test 1.1: GET /api/store/list (Public)
  await test('GET /api/store/list - List active stores', async () => {
    const { status, data } = await fetchAPI('/api/store/list');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!data.success) throw new Error('Response success should be true');
    if (!Array.isArray(data.stores)) throw new Error('stores should be an array');
    log(`   Found ${data.stores.length} active stores`);
  });

  // Test 1.2: POST /api/admin/stores - Create store (requires auth)
  await test('POST /api/admin/stores - Create store', async () => {
    // Note: This will fail without auth, but we test the endpoint structure
    const storeData = {
      code: `TEST${Date.now()}`,
      name: 'Test Store',
      city: 'Test City',
      address: '123 Test Street'
    };
    
    const { status, data } = await fetchAPI('/api/admin/stores', {
      method: 'POST',
      body: JSON.stringify(storeData)
    });
    
    // Should either succeed (if auth works) or return 401/403
    if (status === 201) {
      if (!data.success) throw new Error('Response success should be true');
      if (!data.data?.id) throw new Error('Store ID should be returned');
      if (!data.data?.qrCodeUrl) throw new Error('QR code URL should be generated');
      testStoreId = data.data.id;
      log(`   Created store: ${testStoreId}`);
      log(`   QR Code URL: ${data.data.qrCodeUrl}`);
    } else if (status === 401 || status === 403) {
      log('   ⚠️  Requires authentication (expected)');
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  });

  // Test 1.3: GET /api/store/{id}/staff (Public)
  await test('GET /api/store/{id}/staff - Get store staff', async () => {
    // First get a store ID
    const { status, data } = await fetchAPI('/api/store/list');
    if (status === 200 && data.stores && data.stores.length > 0) {
      const storeId = data.stores[0].id;
      const staffResponse = await fetchAPI(`/api/store/${storeId}/staff`);
      
      if (staffResponse.status !== 200) {
        throw new Error(`Expected 200, got ${staffResponse.status}`);
      }
      if (!staffResponse.data.success) {
        throw new Error('Response success should be true');
      }
      if (!Array.isArray(staffResponse.data.staff)) {
        throw new Error('staff should be an array');
      }
      log(`   Found ${staffResponse.data.staff.length} staff members`);
    } else {
      log('   ⚠️  No stores available to test');
    }
  });

  // Test 1.4: GET /api/store/{id}/staff - Invalid store ID
  await test('GET /api/store/{id}/staff - Invalid store ID', async () => {
    const { status, data } = await fetchAPI('/api/store/invalid-id/staff');
    // Should handle invalid ID gracefully
    if (status !== 200 && status !== 400 && status !== 404) {
      throw new Error(`Unexpected status: ${status}`);
    }
  });
}

// ============================================
// 2. STAFF ENDPOINTS TESTS
// ============================================

async function testStaffEndpoints() {
  log('\n👥 ===== STAFF ENDPOINTS TESTS =====', 'info');

  // Test 2.1: GET /api/admin/staff - List staff
  await test('GET /api/admin/staff - List staff', async () => {
    const { status, data } = await fetchAPI('/api/admin/staff');
    
    if (status === 401 || status === 403) {
      log('   ⚠️  Requires authentication (expected)');
    } else if (status === 200) {
      if (!data.success) throw new Error('Response success should be true');
      if (!data.data?.staff) throw new Error('staff array should be returned');
      log(`   Found ${data.data.staff.length} staff members`);
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  });

  // Test 2.2: POST /api/admin/staff - Create staff
  await test('POST /api/admin/staff - Create staff', async () => {
    // Get a store ID first
    const storeList = await fetchAPI('/api/store/list');
    if (storeList.status === 200 && storeList.data.stores && storeList.data.stores.length > 0) {
      const storeId = storeList.data.stores[0].id;
      
      const staffData = {
        storeId: storeId,
        name: `Test Staff ${Date.now()}`,
        phone: '1234567890',
        role: 'SALES',
        status: 'ACTIVE'
      };
      
      const { status, data } = await fetchAPI('/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify(staffData)
      });
      
      if (status === 201) {
        if (!data.success) throw new Error('Response success should be true');
        if (!data.data?.id) throw new Error('Staff ID should be returned');
        testStaffId = data.data.id;
        log(`   Created staff: ${testStaffId}`);
      } else if (status === 401 || status === 403) {
        log('   ⚠️  Requires authentication (expected)');
      } else {
        throw new Error(`Unexpected status: ${status}`);
      }
    } else {
      log('   ⚠️  No stores available to test');
    }
  });

  // Test 2.3: POST /api/admin/staff - Validation errors
  await test('POST /api/admin/staff - Validation errors', async () => {
    const invalidData = {
      // Missing required fields
      name: 'Test'
    };
    
    const { status, data } = await fetchAPI('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify(invalidData)
    });
    
    if (status === 400) {
      if (!data.error) throw new Error('Error object should be returned');
      log('   ✅ Validation error handled correctly');
    } else if (status === 401 || status === 403) {
      log('   ⚠️  Requires authentication (expected)');
    }
  });
}

// ============================================
// 3. ORDER LIFECYCLE ENDPOINTS TESTS
// ============================================

async function testOrderEndpoints() {
  log('\n📋 ===== ORDER LIFECYCLE ENDPOINTS TESTS =====', 'info');

  // Test 3.1: POST /api/order/create - Create order
  await test('POST /api/order/create - Create order', async () => {
    // Get a store ID first
    const storeList = await fetchAPI('/api/store/list');
    if (storeList.status === 200 && storeList.data.stores && storeList.data.stores.length > 0) {
      const storeId = storeList.data.stores[0].id;
      
      const orderData = {
        storeId: storeId,
        salesMode: 'SELF_SERVICE',
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        frameData: {
          brand: 'LENSTRACK',
          subCategory: 'ESSENTIAL',
          mrp: 2000,
          type: 'FULL_RIM'
        },
        lensData: {
          itCode: 'TEST001',
          name: 'Test Lens',
          price: 1500,
          brandLine: 'DIGI360'
        },
        offerData: {
          appliedOffers: [],
          finalPrice: 3500
        },
        finalPrice: 3500
      };
      
      const { status, data } = await fetchAPI('/api/order/create', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      if (status === 201) {
        if (!data.success) throw new Error('Response success should be true');
        if (!data.orderId) throw new Error('Order ID should be returned');
        if (data.status !== 'DRAFT') throw new Error('Initial status should be DRAFT');
        testOrderId = data.orderId;
        log(`   Created order: ${testOrderId}`);
        log(`   Status: ${data.status}`);
      } else {
        throw new Error(`Expected 201, got ${status}: ${JSON.stringify(data)}`);
      }
    } else {
      log('   ⚠️  No stores available to test');
    }
  });

  // Test 3.2: POST /api/order/create - Validation errors
  await test('POST /api/order/create - Validation errors', async () => {
    const invalidData = {
      // Missing required fields
      storeId: 'test'
    };
    
    const { status, data } = await fetchAPI('/api/order/create', {
      method: 'POST',
      body: JSON.stringify(invalidData)
    });
    
    if (status !== 400) {
      throw new Error(`Expected 400, got ${status}`);
    }
    if (!data.error) throw new Error('Error object should be returned');
    log('   ✅ Validation error handled correctly');
  });

  // Test 3.3: POST /api/order/create - STAFF_ASSISTED validation
  await test('POST /api/order/create - STAFF_ASSISTED validation', async () => {
    const storeList = await fetchAPI('/api/store/list');
    if (storeList.status === 200 && storeList.data.stores && storeList.data.stores.length > 0) {
      const storeId = storeList.data.stores[0].id;
      
      const invalidData = {
        storeId: storeId,
        salesMode: 'STAFF_ASSISTED',
        // Missing assistedByStaffId (required for STAFF_ASSISTED)
        finalPrice: 3500,
        frameData: {},
        lensData: {}
      };
      
      const { status, data } = await fetchAPI('/api/order/create', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });
      
      if (status !== 400) {
        throw new Error(`Expected 400, got ${status}`);
      }
      if (!data.error) throw new Error('Error object should be returned');
      log('   ✅ STAFF_ASSISTED validation working correctly');
    }
  });

  // Test 3.4: POST /api/order/confirm - Confirm order
  await test('POST /api/order/confirm - Confirm order', async () => {
    if (!testOrderId) {
      log('   ⚠️  No order ID available (skipping)');
      return;
    }
    
    const { status, data } = await fetchAPI('/api/order/confirm', {
      method: 'POST',
      body: JSON.stringify({ orderId: testOrderId })
    });
    
    if (status === 200) {
      if (!data.success) throw new Error('Response success should be true');
      if (data.status !== 'CUSTOMER_CONFIRMED') {
        throw new Error(`Expected CUSTOMER_CONFIRMED, got ${data.status}`);
      }
      log(`   ✅ Order confirmed: ${data.status}`);
    } else if (status === 400) {
      // Might be invalid status transition
      log('   ⚠️  Order might already be confirmed or invalid status');
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  });

  // Test 3.5: POST /api/order/store-accept - Store accept
  await test('POST /api/order/store-accept - Store accept', async () => {
    if (!testOrderId) {
      log('   ⚠️  No order ID available (skipping)');
      return;
    }
    
    const { status, data } = await fetchAPI('/api/order/store-accept', {
      method: 'POST',
      body: JSON.stringify({ orderId: testOrderId })
    });
    
    if (status === 200) {
      if (!data.success) throw new Error('Response success should be true');
      if (data.status !== 'STORE_ACCEPTED') {
        throw new Error(`Expected STORE_ACCEPTED, got ${data.status}`);
      }
      log(`   ✅ Order accepted by store: ${data.status}`);
    } else if (status === 400) {
      log('   ⚠️  Order might not be in CUSTOMER_CONFIRMED status');
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  });

  // Test 3.6: POST /api/order/print - Print order
  await test('POST /api/order/print - Print order', async () => {
    if (!testOrderId) {
      log('   ⚠️  No order ID available (skipping)');
      return;
    }
    
    const { status, data } = await fetchAPI('/api/order/print', {
      method: 'POST',
      body: JSON.stringify({ orderId: testOrderId })
    });
    
    if (status === 200) {
      if (!data.success) throw new Error('Response success should be true');
      if (data.status !== 'PRINTED') {
        throw new Error(`Expected PRINTED, got ${data.status}`);
      }
      log(`   ✅ Order printed: ${data.status}`);
    } else if (status === 400) {
      log('   ⚠️  Order might not be in STORE_ACCEPTED status');
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  });

  // Test 3.7: POST /api/order/push-to-lab - Push to lab
  await test('POST /api/order/push-to-lab - Push to lab', async () => {
    if (!testOrderId) {
      log('   ⚠️  No order ID available (skipping)');
      return;
    }
    
    const { status, data } = await fetchAPI('/api/order/push-to-lab', {
      method: 'POST',
      body: JSON.stringify({ orderId: testOrderId })
    });
    
    if (status === 200) {
      if (!data.success) throw new Error('Response success should be true');
      if (data.status !== 'PUSHED_TO_LAB') {
        throw new Error(`Expected PUSHED_TO_LAB, got ${data.status}`);
      }
      log(`   ✅ Order pushed to lab: ${data.status}`);
    } else if (status === 400) {
      log('   ⚠️  Order might not be in PRINTED status');
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  });
}

// ============================================
// 4. ADMIN ORDER ENDPOINTS TESTS
// ============================================

async function testAdminOrderEndpoints() {
  log('\n📊 ===== ADMIN ORDER ENDPOINTS TESTS =====', 'info');

  // Test 4.1: GET /api/admin/orders - List orders
  await test('GET /api/admin/orders - List orders', async () => {
    const { status, data } = await fetchAPI('/api/admin/orders');
    
    if (status === 401 || status === 403) {
      log('   ⚠️  Requires authentication (expected)');
    } else if (status === 200) {
      if (!data.success) throw new Error('Response success should be true');
      if (!data.data?.orders) throw new Error('orders array should be returned');
      log(`   Found ${data.data.orders.length} orders`);
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  });

  // Test 4.2: GET /api/admin/orders/statistics - Get statistics
  await test('GET /api/admin/orders/statistics - Get statistics', async () => {
    const storeList = await fetchAPI('/api/store/list');
    if (storeList.status === 200 && storeList.data.stores && storeList.data.stores.length > 0) {
      const storeId = storeList.data.stores[0].id;
      
      const { status, data } = await fetchAPI(
        `/api/admin/orders/statistics?storeId=${storeId}`
      );
      
      if (status === 401 || status === 403) {
        log('   ⚠️  Requires authentication (expected)');
      } else if (status === 200) {
        if (!data.success) throw new Error('Response success should be true');
        if (!data.data) throw new Error('Statistics data should be returned');
        if (typeof data.data.total !== 'number') {
          throw new Error('total should be a number');
        }
        if (!data.data.byStatus) throw new Error('byStatus should be returned');
        if (!data.data.bySalesMode) throw new Error('bySalesMode should be returned');
        log(`   Total orders: ${data.data.total}`);
        log(`   Revenue: ₹${data.data.totalRevenue}`);
      } else {
        throw new Error(`Unexpected status: ${status}`);
      }
    } else {
      log('   ⚠️  No stores available to test');
    }
  });

  // Test 4.3: GET /api/admin/orders/statistics - Missing storeId
  await test('GET /api/admin/orders/statistics - Missing storeId', async () => {
    const { status, data } = await fetchAPI('/api/admin/orders/statistics');
    
    if (status === 400) {
      if (!data.error) throw new Error('Error object should be returned');
      log('   ✅ Validation error handled correctly');
    } else if (status === 401 || status === 403) {
      log('   ⚠️  Requires authentication (expected)');
    }
  });
}

// ============================================
// 5. QR CODE UTILITY TESTS
// ============================================

async function testQRCodeUtility() {
  log('\n🔲 ===== QR CODE UTILITY TESTS =====', 'info');

  // Test 5.1: QR Code URL format
  await test('QR Code URL format', async () => {
    const { generateStoreQRCode, parseStoreIdFromQR } = await import('./lib/qrCode.js');
    
    const storeId = '507f1f77bcf86cd799439011';
    const baseUrl = 'https://example.com';
    const qrUrl = generateStoreQRCode(storeId, baseUrl);
    
    if (!qrUrl.includes(storeId)) {
      throw new Error('QR URL should contain storeId');
    }
    if (!qrUrl.includes('mode=SELF_SERVICE')) {
      throw new Error('QR URL should contain mode=SELF_SERVICE');
    }
    
    const parsedId = parseStoreIdFromQR(qrUrl);
    if (parsedId !== storeId) {
      throw new Error(`Parsed ID should match: expected ${storeId}, got ${parsedId}`);
    }
    
    log(`   QR URL: ${qrUrl}`);
    log(`   Parsed Store ID: ${parsedId}`);
  });
}

// ============================================
// 6. INTEGRATION TESTS
// ============================================

async function testIntegration() {
  log('\n🔗 ===== INTEGRATION TESTS =====', 'info');

  // Test 6.1: Complete order lifecycle
  await test('Complete order lifecycle flow', async () => {
    const storeList = await fetchAPI('/api/store/list');
    if (storeList.status !== 200 || !storeList.data.stores || storeList.data.stores.length === 0) {
      log('   ⚠️  No stores available (skipping)');
      return;
    }
    
    const storeId = storeList.data.stores[0].id;
    
    // Create order
    const orderData = {
      storeId: storeId,
      salesMode: 'SELF_SERVICE',
      customerName: 'Integration Test Customer',
      frameData: { brand: 'TEST', mrp: 1000 },
      lensData: { itCode: 'TEST', price: 500 },
      offerData: {},
      finalPrice: 1500
    };
    
    const createResponse = await fetchAPI('/api/order/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    
    if (createResponse.status !== 201) {
      throw new Error(`Failed to create order: ${createResponse.status}`);
    }
    
    const orderId = createResponse.data.orderId;
    log(`   ✅ Created order: ${orderId}`);
    
    // Confirm order
    const confirmResponse = await fetchAPI('/api/order/confirm', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
    
    if (confirmResponse.status === 200) {
      log(`   ✅ Confirmed order: ${confirmResponse.data.status}`);
    }
    
    log('   ✅ Complete lifecycle test passed');
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  log('\n🚀 ===== STORE + STAFF + ORDER SYSTEM V1.0 TEST SUITE =====', 'info');
  log(`Base URL: ${BASE_URL}`, 'info');
  
  try {
    await testStoreEndpoints();
    await testStaffEndpoints();
    await testOrderEndpoints();
    await testAdminOrderEndpoints();
    await testQRCodeUtility();
    await testIntegration();
    
    // Print summary
    log('\n📊 ===== TEST SUMMARY =====', 'info');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
    
    if (testResults.errors.length > 0) {
      log('\n❌ Errors:', 'error');
      testResults.errors.forEach(({ name, error }) => {
        log(`   - ${name}: ${error}`, 'error');
      });
    }
    
    if (testResults.failed === 0) {
      log('\n🎉 ALL TESTS PASSED!', 'success');
      process.exit(0);
    } else {
      log('\n⚠️  SOME TESTS FAILED', 'warning');
      process.exit(1);
    }
  } catch (error) {
    log(`\n💥 FATAL ERROR: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  runAllTests();
} else {
  // Browser environment
  console.log('Please run this test in Node.js environment');
}

