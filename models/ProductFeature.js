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

export async function syncProductFeatures(productId, featureCodes) {
  const collection = await getProductFeatureCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  
  // Delete existing
  await collection.deleteMany({ productId: pId });
  
  // Insert new - featureCodes can be array of codes (F01, F02, etc.) or feature IDs
  if (featureCodes && featureCodes.length > 0) {
    const { getFeatureByCode, getAllFeatures } = await import('./Feature');
    const featureRecords = [];
    
    for (const featureCodeOrId of featureCodes) {
      let featureId;
      
      // Check if it's a code (starts with F) or an ID
      if (typeof featureCodeOrId === 'string' && featureCodeOrId.match(/^F\d{2}$/)) {
        // It's a feature code (F01, F02, etc.)
        const feature = await getFeatureByCode(featureCodeOrId);
        if (feature) {
          featureId = feature._id;
        }
      } else {
        // It's a feature ID (ObjectId string)
        featureId = typeof featureCodeOrId === 'string' ? new ObjectId(featureCodeOrId) : featureCodeOrId;
      }
      
      if (featureId) {
        featureRecords.push({
          productId: pId,
          featureId: featureId
        });
      }
    }
    
    if (featureRecords.length > 0) {
      await collection.insertMany(featureRecords);
    }
  }
  
  return await getProductFeaturesByProduct(productId);
}
