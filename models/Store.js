// models/Store.js
// MongoDB model for Store

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getStoreCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('stores');
}

export async function createStore(storeData) {
  try {
    // Validate organizationId
    if (!storeData.organizationId) {
      throw new Error('organizationId is required');
    }
    
    // Validate required fields
    if (!storeData.code || !storeData.name) {
      throw new Error('Store code and name are required');
    }
    
    const collection = await getStoreCollection();
    const now = new Date();
    
    // Convert organizationId to ObjectId
    let organizationId;
    try {
      organizationId = typeof storeData.organizationId === 'string' 
        ? new ObjectId(storeData.organizationId) 
        : storeData.organizationId;
    } catch (error) {
      throw new Error(`Invalid organizationId format: ${storeData.organizationId}`);
    }
    
    // Normalize code: trim whitespace
    const normalizedCode = String(storeData.code).trim();
    
    const store = {
      code: normalizedCode,
      name: storeData.name,
      address: storeData.address || null,
      city: storeData.city || null,
      state: storeData.state || null,
      pincode: storeData.pincode || null,
      phone: storeData.phone || null,
      email: storeData.email || null,
      gstNumber: storeData.gstNumber || null,
      organizationId: organizationId,
      // V1.0 Spec: Store status and QR code
      status: storeData.status || 'ACTIVE', // ACTIVE | INACTIVE
      qrCodeUrl: storeData.qrCodeUrl || null, // QR for Lens Advisor with storeId embedded
      isActive: storeData.isActive !== undefined ? storeData.isActive : (storeData.status === 'ACTIVE'), // Backward compatibility
      createdAt: now,
      updatedAt: now
    };
    
    console.log('Creating store with data:', {
      code: store.code,
      name: store.name,
      organizationId: organizationId.toString(),
      hasMongoUri: !!process.env.MONGODB_URI
    });
    
    const result = await collection.insertOne(store);
    
    if (!result.insertedId) {
      throw new Error('Failed to insert store - no insertedId returned');
    }
    
    console.log('Store created successfully:', result.insertedId.toString());
    
    return { ...store, _id: result.insertedId };
  } catch (error) {
    console.error('createStore error:', error);
    console.error('createStore error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      storeData: {
        code: storeData?.code,
        name: storeData?.name,
        hasOrganizationId: !!storeData?.organizationId
      }
    });
    throw error;
  }
}

export async function getStoreById(id) {
  try {
    if (!id) {
      return null;
    }
    const collection = await getStoreCollection();
    let objectId;
    try {
      objectId = typeof id === 'string' ? new ObjectId(id) : id;
    } catch (error) {
      console.error('Invalid ObjectId format:', id);
      return null;
    }
    return await collection.findOne({ _id: objectId });
  } catch (error) {
    console.error('getStoreById error:', error);
    throw error;
  }
}

export async function getStoreByCode(organizationId, code, includeInactive = false) {
  try {
    if (!organizationId || !code) {
      return null;
    }
    const collection = await getStoreCollection();
    let orgId;
    try {
      orgId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
    } catch (error) {
      console.error('Invalid organizationId format:', organizationId);
      return null;
    }
    
    // Normalize code: trim and convert to uppercase for case-insensitive comparison
    const normalizedCode = String(code).trim().toUpperCase();
    
    // Build query - only check active stores unless includeInactive is true
    const query = {
      organizationId: orgId,
      code: { $regex: new RegExp(`^${normalizedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    };
    
    if (!includeInactive) {
      query.isActive = { $ne: false }; // Check for active stores (isActive !== false)
    }
    
    return await collection.findOne(query);
  } catch (error) {
    console.error('getStoreByCode error:', error);
    throw error;
  }
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
    const allowedFields = ['code', 'name', 'address', 'city', 'state', 'pincode', 'phone', 'email', 'gstNumber', 'isActive', 'status', 'qrCodeUrl'];
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
