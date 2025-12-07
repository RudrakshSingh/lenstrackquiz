// models/Session.js
// MongoDB model for Session

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';
import { ProductCategory } from './Product';

export const SessionStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CONVERTED: 'CONVERTED',
  ABANDONED: 'ABANDONED'
};

export async function getSessionCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('sessions');
}

export async function createSession(sessionData) {
  const collection = await getSessionCollection();
  const now = new Date();
  const session = {
    storeId: typeof sessionData.storeId === 'string' 
      ? new ObjectId(sessionData.storeId) 
      : sessionData.storeId,
    userId: typeof sessionData.userId === 'string' 
      ? new ObjectId(sessionData.userId) 
      : sessionData.userId,
    customerName: sessionData.customerName || null,
    customerPhone: sessionData.customerPhone || null,
    customerEmail: sessionData.customerEmail || null,
    category: sessionData.category || ProductCategory.EYEGLASSES,
    status: sessionData.status || SessionStatus.IN_PROGRESS,
    startedAt: sessionData.startedAt || now,
    completedAt: sessionData.completedAt || null,
    convertedAt: sessionData.convertedAt || null,
    abandonedAt: sessionData.abandonedAt || null,
    notes: sessionData.notes || null
  };
  const result = await collection.insertOne(session);
  return { ...session, _id: result.insertedId };
}

export async function getSessionById(id) {
  const collection = await getSessionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getAllSessions(filter = {}) {
  const collection = await getSessionCollection();
  // Convert IDs to ObjectId if present
  if (filter.storeId && typeof filter.storeId === 'string') {
    filter.storeId = new ObjectId(filter.storeId);
  }
  if (filter.userId && typeof filter.userId === 'string') {
    filter.userId = new ObjectId(filter.userId);
  }
  return await collection.find(filter).sort({ startedAt: -1 }).toArray();
}

export async function updateSession(id, updateData) {
  const collection = await getSessionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.storeId && typeof update.storeId === 'string') {
    update.storeId = new ObjectId(update.storeId);
  }
  if (update.userId && typeof update.userId === 'string') {
    update.userId = new ObjectId(update.userId);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteSession(id) {
  const collection = await getSessionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}
