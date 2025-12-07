// models/Customer.js
// MongoDB schema/model for Customer data

import { ObjectId } from 'mongodb';

export const CustomerSchema = {
  name: { type: String, required: true },
  number: { type: String, required: true },
  email: { type: String, default: '' },
  power: {
    right: {
      sph: { type: Number, default: null },
      cyl: { type: Number, default: null }
    },
    left: {
      sph: { type: Number, default: null },
      cyl: { type: Number, default: null }
    }
  },
  add: { type: Number, default: null },
  frameType: { type: String, default: null },
  answers: {
    vision_need: { type: String, default: null },
    screen_hours: { type: Number, default: null },
    outdoor_hours: { type: String, default: null },
    driving_pattern: { type: String, default: null },
    symptoms: { type: [String], default: [] },
    preference: { type: String, default: null },
    second_pair_interest: { type: String, default: null }
  },
  recommendation: { type: Object, default: null },
  selectedLensId: { type: String, default: null },
  selectedSecondPairLensId: { type: String, default: null },
  selectedOfferId: { type: String, default: null },
  language: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Helper function to get customer collection
export async function getCustomerCollection() {
  const { getDatabase } = await import('../lib/mongodb.js');
  const db = await getDatabase('lensquiz');
  return db.collection('customers');
}

// Helper functions for CRUD operations
export async function createCustomer(customerData) {
  const collection = await getCustomerCollection();
  const now = new Date();
  const customer = {
    ...customerData,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(customer);
  return { ...customer, _id: result.insertedId };
}

export async function getCustomerById(id) {
  const collection = await getCustomerCollection();
  // Handle both ObjectId and string
  const objectId = id instanceof ObjectId ? id : new ObjectId(id);
  return await collection.findOne({ _id: objectId });
}

export async function updateCustomer(id, updateData) {
  const collection = await getCustomerCollection();
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  // Handle both ObjectId and string
  const objectId = id instanceof ObjectId ? id : new ObjectId(id);
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function getAllCustomers(filter = {}) {
  const collection = await getCustomerCollection();
  return await collection.find(filter).sort({ createdAt: -1 }).toArray();
}

