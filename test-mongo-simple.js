// Simple MongoDB connection test
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = 'lensquiz';

async function test() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', ') || 'None');
    
    // Test insert
    const test = await db.collection('test').insertOne({ test: true, date: new Date() });
    console.log('✅ Test document inserted:', test.insertedId);
    
    // Count
    const count = await db.collection('test').countDocuments();
    console.log('✅ Test collection has', count, 'documents');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

test();
