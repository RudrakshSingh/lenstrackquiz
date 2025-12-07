// models/Store.js
// MongoDB model for Store

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getStoreCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('stores');
}

export async function createStore(storeData) {
  const collection = await getStoreCollection();
  const now = new Date();
  const store = {
    ...storeData,
    organizationId: typeof storeData.organizationId === 'string' 
      ? new ObjectId(storeData.organizationId) 
      : storeData.organizationId,
    isActive: storeData.isActive !== undefined ? storeData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(store);
  return { ...store, _id: result.insertedId };
}

export async function getStoreById(id) {
  const collection = await getStoreCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getStoreByCode(organizationId, code) {
  const collection = await getStoreCollection();
  const orgId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
  return await collection.findOne({ organizationId: orgId, code });
}

export async function getAllStores(filter = {}) {
  const collection = await getStoreCollection();
  // Convert organizationId to ObjectId if present
  if (filter.organizationId && typeof filter.organizationId === 'string') {
    filter.organizationId = new ObjectId(filter.organizationId);
  }
  return await collection.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function updateStore(id, updateData) {
  try {
    const collection = await getStoreCollection();
    
    // Validate ID format
    if (!id) {
      throw new Error('Store ID is required');
    }
    
    let objectId;
    try {
      objectId = typeof id === 'string' ? new ObjectId(id) : id;
    } catch (error) {
      throw new Error(`Invalid store ID format: ${id}`);
    }
    
    // Build update object - exclude organizationId and _id
    const update = {
      updatedAt: new Date()
    };
    
    // Only include fields that are allowed to be updated
    const allowedFields = ['code', 'name', 'address', 'city', 'state', 'pincode', 'phone', 'email', 'gstNumber', 'isActive'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        update[field] = updateData[field];
      }
    });
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return null;
    }
    
    return result.value;
  } catch (error) {
    console.error('updateStore error:', error);
    throw error;
  }
}

export async function deleteStore(id) {
  const collection = await getStoreCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function getStoresByOrganization(organizationId) {
  const collection = await getStoreCollection();
  const orgId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
  return await collection.find({ organizationId: orgId }).toArray();
}
