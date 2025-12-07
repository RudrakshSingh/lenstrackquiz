// models/ProductAnswerScore.js
// MongoDB model for direct Answer → Product score boosts

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getProductAnswerScoreCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('productAnswerScores');
}

export async function createProductAnswerScore(scoreData) {
  const collection = await getProductAnswerScoreCollection();
  const score = {
    productId: typeof scoreData.productId === 'string' ? new ObjectId(scoreData.productId) : scoreData.productId,
    answerId: typeof scoreData.answerId === 'string' ? new ObjectId(scoreData.answerId) : scoreData.answerId,
    score: typeof scoreData.score === 'number' ? scoreData.score : parseFloat(scoreData.score)
  };
  const result = await collection.insertOne(score);
  return { ...score, _id: result.insertedId };
}

export async function getProductAnswerScoresByProduct(productId) {
  const collection = await getProductAnswerScoreCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.find({ productId: pId }).toArray();
}

export async function deleteProductAnswerScoresByProduct(productId) {
  const collection = await getProductAnswerScoreCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.deleteMany({ productId: pId });
}

export async function syncProductAnswerScores(productId, mappings) {
  const collection = await getProductAnswerScoreCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  
  // Delete existing
  await collection.deleteMany({ productId: pId });
  
  // Insert new
  if (mappings && mappings.length > 0) {
    const scoreRecords = mappings.map(mapping => ({
      productId: pId,
      answerId: typeof mapping.answerId === 'string' ? new ObjectId(mapping.answerId) : mapping.answerId,
      score: typeof mapping.score === 'number' ? mapping.score : parseFloat(mapping.score)
    }));
    await collection.insertMany(scoreRecords);
  }
  
  return await getProductAnswerScoresByProduct(productId);
}

