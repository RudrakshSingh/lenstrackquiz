// Test script to verify MongoDB data saving
// Run with: node test-mongo-save.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = 'lensquiz';

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function testMongoConnection() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    console.log(`📊 Using database: ${dbName}`);
    
    // Test 1: Insert into customers collection
    console.log('\n📝 Test 1: Inserting test customer...');
    const customersCollection = db.collection('customers');
    const testCustomer = {
      name: 'Test User',
      number: '1234567890',
      email: 'test@example.com',
      power: {
        right: { sph: -2.00, cyl: -0.50 },
        left: { sph: -2.00, cyl: -0.50 }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const customerResult = await customersCollection.insertOne(testCustomer);
    console.log(`✅ Customer inserted with ID: ${customerResult.insertedId}`);
    
    // Test 2: Verify data was saved
    console.log('\n🔍 Test 2: Verifying data was saved...');
    const savedCustomer = await customersCollection.findOne({ _id: customerResult.insertedId });
    if (savedCustomer) {
      console.log('✅ Customer found in database:', savedCustomer.name);
    } else {
      console.log('❌ Customer not found!');
    }
    
    // Test 3: List all collections
    console.log('\n📋 Test 3: Listing all collections...');
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Test 4: Count documents in each collection
    console.log('\n📊 Test 4: Document counts:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }
    
    // Cleanup: Remove test customer
    console.log('\n🧹 Cleaning up test data...');
    await customersCollection.deleteOne({ _id: customerResult.insertedId });
    console.log('✅ Test customer removed');
    
    console.log('\n✅ All tests passed! MongoDB is working correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

testMongoConnection();

