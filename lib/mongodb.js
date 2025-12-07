// lib/mongodb.js
// MongoDB connection utility

import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI is not set. Please add it to .env.local');
  console.warn('⚠️ Database operations will fail until MongoDB is configured.');
}

const uri = process.env.MONGODB_URI;
// Note: useUnifiedTopology and useNewUrlParser are deprecated in MongoDB driver v4+
// These options are now the default behavior
const options = {};

let client;
let clientPromise;

if (!uri) {
  // If no URI, create a rejected promise that will fail with a helpful message
  clientPromise = Promise.reject(new Error('MONGODB_URI is not configured. Please add it to .env.local file.'));
} else if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    try {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    } catch (error) {
      console.error('Failed to create MongoDB client:', error);
      global._mongoClientPromise = Promise.reject(error);
    }
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  try {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  } catch (error) {
    console.error('Failed to create MongoDB client:', error);
    clientPromise = Promise.reject(error);
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get database instance
export async function getDatabase(dbName = 'lensquiz') {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('MongoDB connection error in getDatabase:', error);
    if (error.message && (error.message.includes('MONGODB_URI') || error.message.includes('not configured'))) {
      throw new Error('MongoDB is not configured. Please add MONGODB_URI to .env.local file.');
    }
    if (error.message && (error.message.includes('queryTxt') || error.message.includes('ENOTFOUND') || error.message.includes('EREFUSED'))) {
      throw new Error('Cannot connect to MongoDB. Please check your MONGODB_URI connection string and ensure the database is accessible.');
    }
    throw error;
  }
}

