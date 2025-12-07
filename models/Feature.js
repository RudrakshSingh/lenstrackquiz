// models/Feature.js
// MongoDB model for Feature master

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const FeatureCategory = {
  DURABILITY: 'DURABILITY',
  COATING: 'COATING',
  PROTECTION: 'PROTECTION',
  LIFESTYLE: 'LIFESTYLE',
  VISION: 'VISION'
};

export async function getFeatureCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('features');
}

export async function createFeature(featureData) {
  const collection = await getFeatureCollection();
  const now = new Date();
  const feature = {
    code: featureData.code,
    name: featureData.name,
    category: featureData.category,
    displayOrder: featureData.displayOrder || 0,
    icon: featureData.icon || null,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(feature);
  return { ...feature, _id: result.insertedId };
}

export async function getFeatureById(id) {
  const collection = await getFeatureCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getFeatureByCode(code) {
  const collection = await getFeatureCollection();
  return await collection.findOne({ code });
}

export async function getFeatureByKey(organizationId, key, category) {
  const collection = await getFeatureCollection();
  const filter = { code: key };
  if (organizationId) {
    filter.organizationId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
  }
  if (category) {
    filter.category = category;
  }
  return await collection.findOne(filter);
}

export async function getAllFeatures(filter = {}) {
  const collection = await getFeatureCollection();
  return await collection.find(filter).sort({ displayOrder: 1 }).toArray();
}

export async function updateFeature(id, updateData) {
  const collection = await getFeatureCollection();
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

export async function deleteFeature(id) {
  const collection = await getFeatureCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}
