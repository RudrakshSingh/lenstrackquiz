// models/ProductSubBrand.js
// MongoDB model for ProductSubBrand (generic sub-brand master)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getProductSubBrandCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('productSubBrands');
}

export async function createProductSubBrand(subBrandData) {
  const collection = await getProductSubBrandCollection();
  const now = new Date();
  
  const subBrand = {
    brandId: typeof subBrandData.brandId === 'string' ? new ObjectId(subBrandData.brandId) : subBrandData.brandId,
    name: subBrandData.name.trim(),
    offerRuleIds: subBrandData.offerRuleIds || [],
    isActive: subBrandData.isActive !== undefined ? subBrandData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(subBrand);
  return { ...subBrand, _id: result.insertedId };
}

export async function getProductSubBrandById(id) {
  const collection = await getProductSubBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getProductSubBrandsByBrand(brandId) {
  const collection = await getProductSubBrandCollection();
  const bId = typeof brandId === 'string' ? new ObjectId(brandId) : brandId;
  return await collection.find({ brandId: bId }).sort({ name: 1 }).toArray();
}

export async function getAllProductSubBrands(filter = {}) {
  const collection = await getProductSubBrandCollection();
  // Convert brandId to ObjectId if it's a string
  if (filter.brandId && typeof filter.brandId === 'string') {
    filter.brandId = new ObjectId(filter.brandId);
  }
  return await collection.find(filter).sort({ name: 1 }).toArray();
}

export async function updateProductSubBrand(id, updateData) {
  const collection = await getProductSubBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.brandId && typeof update.brandId === 'string') {
    update.brandId = new ObjectId(update.brandId);
  }
  if (update.name) {
    update.name = update.name.trim();
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  
  // If update failed, try to get the document to see if it exists
  if (!result.value) {
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
      return null; // Document doesn't exist
    }
    // Document exists but update failed, return the existing document
    return existing;
  }
  
  return result.value;
}

export async function deleteProductSubBrand(id) {
  const collection = await getProductSubBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function deleteProductSubBrandsByBrand(brandId) {
  const collection = await getProductSubBrandCollection();
  const bId = typeof brandId === 'string' ? new ObjectId(brandId) : brandId;
  return await collection.deleteMany({ brandId: bId });
}

