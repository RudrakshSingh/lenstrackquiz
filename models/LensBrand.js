// models/LensBrand.js
// MongoDB model for LensBrand (Brand Lines like DIGI360, DriveXpert, etc.)
// V2 Architecture: Lens brands are separate from ProductBrands

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getLensBrandCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('lensBrands');
}

export async function createLensBrand(brandData) {
  const collection = await getLensBrandCollection();
  const now = new Date();
  
  const brand = {
    name: brandData.name.trim(),
    description: brandData.description || null,
    isActive: brandData.isActive !== undefined ? brandData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(brand);
  return { ...brand, _id: result.insertedId };
}

export async function getLensBrandById(id) {
  const collection = await getLensBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getLensBrandByName(name) {
  const collection = await getLensBrandCollection();
  return await collection.findOne({ name: name.trim() });
}

export async function getAllLensBrands(filter = {}) {
  const collection = await getLensBrandCollection();
  return await collection.find(filter).sort({ name: 1 }).toArray();
}

export async function getActiveLensBrands(filter = {}) {
  const collection = await getLensBrandCollection();
  return await collection.find({ ...filter, isActive: true }).sort({ name: 1 }).toArray();
}

export async function updateLensBrand(id, updateData) {
  const collection = await getLensBrandCollection();
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

export async function deleteLensBrand(id) {
  const collection = await getLensBrandCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

