// models/Staff.js
// MongoDB model for Staff (V1.0 Spec)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const StaffRole = {
  STORE_MANAGER: 'STORE_MANAGER',
  NC: 'NC',
  JR: 'JR',
  OPTOMETRIST: 'OPTOMETRIST',
  SALES: 'SALES'
};

export const StaffStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export async function getStaffCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('staff');
}

export async function createStaff(staffData) {
  try {
    // Validate required fields
    if (!staffData.storeId || !staffData.name || !staffData.role) {
      throw new Error('storeId, name, and role are required');
    }
    
    const collection = await getStaffCollection();
    const now = new Date();
    
    // Convert storeId to ObjectId
    let storeId;
    try {
      storeId = typeof staffData.storeId === 'string' 
        ? new ObjectId(staffData.storeId) 
        : staffData.storeId;
    } catch (error) {
      throw new Error(`Invalid storeId format: ${staffData.storeId}`);
    }
    
    const staff = {
      storeId: storeId,
      name: staffData.name,
      phone: staffData.phone || null,
      role: staffData.role, // STORE_MANAGER, NC, JR, OPTOMETRIST, SALES
      status: staffData.status || StaffStatus.ACTIVE, // ACTIVE | INACTIVE
      createdAt: now,
      updatedAt: now
    };
    
    const result = await collection.insertOne(staff);
    return { ...staff, _id: result.insertedId };
  } catch (error) {
    console.error('createStaff error:', error);
    throw error;
  }
}

export async function getStaffById(id) {
  try {
    if (!id) return null;
    const collection = await getStaffCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await collection.findOne({ _id: objectId });
  } catch (error) {
    console.error('getStaffById error:', error);
    return null;
  }
}

export async function getStaffByStore(storeId) {
  try {
    if (!storeId) return [];
    const collection = await getStaffCollection();
    const objectId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
    return await collection.find({ storeId: objectId, status: StaffStatus.ACTIVE }).sort({ name: 1 }).toArray();
  } catch (error) {
    console.error('getStaffByStore error:', error);
    return [];
  }
}

export async function getAllStaff(filter = {}) {
  const collection = await getStaffCollection();
  // Convert storeId to ObjectId if present
  if (filter.storeId && typeof filter.storeId === 'string') {
    filter.storeId = new ObjectId(filter.storeId);
  }
  return await collection.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function updateStaff(id, updateData) {
  try {
    const collection = await getStaffCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const update = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Don't allow updating storeId
    delete update.storeId;
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: 'after' }
    );
    
    return result.value;
  } catch (error) {
    console.error('updateStaff error:', error);
    throw error;
  }
}

export async function deleteStaff(id) {
  const collection = await getStaffCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

