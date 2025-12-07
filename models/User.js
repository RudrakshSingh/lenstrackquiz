// models/User.js
// MongoDB model for User

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STORE_MANAGER: 'STORE_MANAGER',
  SALES_EXECUTIVE: 'SALES_EXECUTIVE'
};

export async function getUserCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('users');
}

export async function createUser(userData) {
  const collection = await getUserCollection();
  const now = new Date();
  const user = {
    ...userData,
    organizationId: typeof userData.organizationId === 'string' 
      ? new ObjectId(userData.organizationId) 
      : userData.organizationId,
    storeId: userData.storeId 
      ? (typeof userData.storeId === 'string' ? new ObjectId(userData.storeId) : userData.storeId)
      : null,
    role: userData.role || UserRole.SALES_EXECUTIVE,
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(user);
  return { ...user, _id: result.insertedId };
}

export async function getUserById(id) {
  const collection = await getUserCollection();
  // Handle both ObjectId and string, and also handle if id is already an ObjectId
  let objectId;
  if (typeof id === 'string') {
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      // If it's not a valid ObjectId string, try finding by string
      return await collection.findOne({ _id: id });
    }
  } else {
    objectId = id;
  }
  return await collection.findOne({ _id: objectId });
}

export async function getUserByEmail(organizationId, email) {
  const collection = await getUserCollection();
  const orgId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
  return await collection.findOne({ organizationId: orgId, email });
}

export async function getAllUsers(filter = {}) {
  const collection = await getUserCollection();
  // Create a copy of filter to avoid mutating the original
  const queryFilter = { ...filter };
  // Convert IDs to ObjectId if present
  if (queryFilter.organizationId && typeof queryFilter.organizationId === 'string') {
    queryFilter.organizationId = new ObjectId(queryFilter.organizationId);
  }
  if (queryFilter.storeId && typeof queryFilter.storeId === 'string') {
    queryFilter.storeId = new ObjectId(queryFilter.storeId);
  }
  return await collection.find(queryFilter).sort({ createdAt: -1 }).toArray();
}

export async function updateUser(id, updateData) {
  const collection = await getUserCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.organizationId && typeof update.organizationId === 'string') {
    update.organizationId = new ObjectId(update.organizationId);
  }
  if (update.storeId && typeof update.storeId === 'string') {
    update.storeId = new ObjectId(update.storeId);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteUser(id) {
  const collection = await getUserCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function updateLastLogin(userId) {
  const collection = await getUserCollection();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  await collection.updateOne(
    { _id: objectId },
    { $set: { lastLoginAt: new Date() } }
  );
}
