// models/SessionRecommendation.js
// MongoDB model for SessionRecommendation

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getSessionRecommendationCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('sessionRecommendations');
}

export async function createSessionRecommendation(recommendationData) {
  const collection = await getSessionRecommendationCollection();
  const now = new Date();
  const recommendation = {
    sessionId: typeof recommendationData.sessionId === 'string' 
      ? new ObjectId(recommendationData.sessionId) 
      : recommendationData.sessionId,
    productId: typeof recommendationData.productId === 'string' 
      ? new ObjectId(recommendationData.productId) 
      : recommendationData.productId,
    matchScore: recommendationData.matchScore || 0,
    rank: recommendationData.rank || 0,
    isSelected: recommendationData.isSelected || false,
    createdAt: now
  };
  const result = await collection.insertOne(recommendation);
  return { ...recommendation, _id: result.insertedId };
}

export async function getSessionRecommendationsBySession(sessionId) {
  const collection = await getSessionRecommendationCollection();
  const sId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
  return await collection.find({ sessionId: sId }).sort({ rank: 1 }).toArray();
}

export async function updateSessionRecommendation(sessionId, productId, updateData) {
  const collection = await getSessionRecommendationCollection();
  const sId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  const result = await collection.findOneAndUpdate(
    { sessionId: sId, productId: pId },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteSessionRecommendationsBySession(sessionId) {
  const collection = await getSessionRecommendationCollection();
  const sId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
  return await collection.deleteMany({ sessionId: sId });
}
