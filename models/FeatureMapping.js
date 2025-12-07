// models/FeatureMapping.js
// MongoDB model for FeatureMapping

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getFeatureMappingCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('featureMappings');
}

export async function createFeatureMapping(mappingData) {
  const collection = await getFeatureMappingCollection();
  const mapping = {
    questionId: typeof mappingData.questionId === 'string' 
      ? new ObjectId(mappingData.questionId) 
      : mappingData.questionId,
    optionKey: mappingData.optionKey,
    featureId: typeof mappingData.featureId === 'string' 
      ? new ObjectId(mappingData.featureId) 
      : mappingData.featureId,
    weight: mappingData.weight || 1.0
  };
  const result = await collection.insertOne(mapping);
  return { ...mapping, _id: result.insertedId };
}

export async function getFeatureMappingById(id) {
  const collection = await getFeatureMappingCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getFeatureMappingsByQuestion(questionId) {
  const collection = await getFeatureMappingCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.find({ questionId: qId }).toArray();
}

export async function getFeatureMappingsByFeature(featureId) {
  const collection = await getFeatureMappingCollection();
  const fId = typeof featureId === 'string' ? new ObjectId(featureId) : featureId;
  return await collection.find({ featureId: fId }).toArray();
}

export async function getFeatureMapping(questionId, optionKey, featureId) {
  const collection = await getFeatureMappingCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  const fId = typeof featureId === 'string' ? new ObjectId(featureId) : featureId;
  return await collection.findOne({ questionId: qId, optionKey, featureId: fId });
}

export async function updateFeatureMapping(id, updateData) {
  const collection = await getFeatureMappingCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = { ...updateData };
  if (update.questionId && typeof update.questionId === 'string') {
    update.questionId = new ObjectId(update.questionId);
  }
  if (update.featureId && typeof update.featureId === 'string') {
    update.featureId = new ObjectId(update.featureId);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteFeatureMapping(id) {
  const collection = await getFeatureMappingCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function deleteFeatureMappingsByQuestion(questionId) {
  const collection = await getFeatureMappingCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.deleteMany({ questionId: qId });
}
