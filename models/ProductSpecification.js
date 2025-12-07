// models/ProductSpecification.js
// MongoDB model for Product Specifications

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getProductSpecificationCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('productSpecifications');
}

export async function createProductSpecification(specData) {
  const collection = await getProductSpecificationCollection();
  const now = new Date();
  const spec = {
    productId: typeof specData.productId === 'string' ? new ObjectId(specData.productId) : specData.productId,
    key: specData.key,
    value: specData.value,
    group: specData.group,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(spec);
  return { ...spec, _id: result.insertedId };
}

export async function getProductSpecificationsByProduct(productId) {
  const collection = await getProductSpecificationCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.find({ productId: pId }).toArray();
}

export async function deleteProductSpecificationsByProduct(productId) {
  const collection = await getProductSpecificationCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.deleteMany({ productId: pId });
}

export async function syncProductSpecifications(productId, specs) {
  const collection = await getProductSpecificationCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  
  // Delete existing
  await collection.deleteMany({ productId: pId });
  
  // Insert new
  if (specs && specs.length > 0) {
    const now = new Date();
    const specRecords = specs.map(spec => ({
      productId: pId,
      key: spec.key,
      value: spec.value,
      group: spec.group,
      createdAt: now,
      updatedAt: now
    }));
    await collection.insertMany(specRecords);
  }
  
  return await getProductSpecificationsByProduct(productId);
}

