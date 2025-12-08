// models/ProductBrand.js
// MongoDB model for ProductBrand (generic brand master, not tied to frame only)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getProductBrandCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('productBrands');
}

export async function createProductBrand(brandData) {
  const collection = await getProductBrandCollection();
  const now = new Date();
  
  const brand = {
    name: brandData.name.trim(),
    isActive: brandData.isActive !== undefined ? brandData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(brand);
  return { ...brand, _id: result.insertedId };
}

export async function getProductBrandById(id) {
  const collection = await getProductBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getProductBrandByName(name) {
  const collection = await getProductBrandCollection();
  return await collection.findOne({ name: name.trim() });
}

export async function getAllProductBrands(filter = {}) {
  const collection = await getProductBrandCollection();
  return await collection.find(filter).sort({ name: 1 }).toArray();
}

export async function updateProductBrand(id, updateData) {
  const collection = await getProductBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.name) {
    update.name = update.name.trim();
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteProductBrand(id) {
  const collection = await getProductBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

