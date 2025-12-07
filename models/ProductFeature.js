// models/ProductFeature.js
// MongoDB model for Product-Feature junction

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getProductFeatureCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('productFeatures');
}

export async function createProductFeature(productFeatureData) {
  const collection = await getProductFeatureCollection();
  const productFeature = {
    productId: typeof productFeatureData.productId === 'string' ? new ObjectId(productFeatureData.productId) : productFeatureData.productId,
    featureId: typeof productFeatureData.featureId === 'string' ? new ObjectId(productFeatureData.featureId) : productFeatureData.featureId
  };
  const result = await collection.insertOne(productFeature);
  return { ...productFeature, _id: result.insertedId };
}

export async function getProductFeaturesByProduct(productId) {
  const collection = await getProductFeatureCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.find({ productId: pId }).toArray();
}

export async function deleteProductFeaturesByProduct(productId) {
  const collection = await getProductFeatureCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.deleteMany({ productId: pId });
}

export async function syncProductFeatures(productId, featureIds) {
  const collection = await getProductFeatureCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  
  // Delete existing
  await collection.deleteMany({ productId: pId });
  
  // Insert new
  if (featureIds && featureIds.length > 0) {
    const features = featureIds.map(featureId => ({
      productId: pId,
      featureId: typeof featureId === 'string' ? new ObjectId(featureId) : featureId
    }));
    await collection.insertMany(features);
  }
  
  return await getProductFeaturesByProduct(productId);
}
