// models/Benefit.js
// MongoDB model for Benefit master

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getBenefitCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('benefits');
}

export async function createBenefit(benefitData) {
  const collection = await getBenefitCollection();
  const now = new Date();
  const benefit = {
    code: benefitData.code,
    name: benefitData.name,
    description: benefitData.description || null,
    pointWeight: benefitData.pointWeight || 1.0,
    maxScore: benefitData.maxScore !== undefined ? benefitData.maxScore : 3.0,
    isActive: benefitData.isActive !== undefined ? benefitData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(benefit);
  return { ...benefit, _id: result.insertedId };
}

export async function getBenefitById(id) {
  const collection = await getBenefitCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getBenefitByCode(code) {
  const collection = await getBenefitCollection();
  return await collection.findOne({ code });
}

export async function getAllBenefits(filter = {}) {
  const collection = await getBenefitCollection();
  return await collection.find(filter).sort({ code: 1 }).toArray();
}

export async function updateBenefit(id, updateData) {
  const collection = await getBenefitCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteBenefit(id) {
  const collection = await getBenefitCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

