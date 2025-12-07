// Quick health check script
// Run with: node check-server-health.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🔍 Checking server health...\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   JWT_EXPIRY:', process.env.JWT_EXPIRY || 'Not set (using default)');
console.log('');

// Check MongoDB connection
if (process.env.MONGODB_URI) {
  console.log('2. MongoDB Connection:');
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('   ✅ MongoDB connection successful');
    await client.close();
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
  }
  console.log('');
}

console.log('✅ Health check complete!');

