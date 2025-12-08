// models/RetailProduct.js
// MongoDB model for RetailProduct (Frames, Sunglasses, Contact Lenses, Accessories)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const RetailProductType = {
  FRAME: 'FRAME',
  SUNGLASS: 'SUNGLASS',
  CONTACT_LENS: 'CONTACT_LENS',
  ACCESSORY: 'ACCESSORY'
};

export async function getRetailProductCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('retailProducts');
}

export async function createRetailProduct(productData) {
  const collection = await getRetailProductCollection();
  const now = new Date();
  
  const product = {
    type: productData.type, // FRAME | SUNGLASS | CONTACT_LENS | ACCESSORY
    brandId: typeof productData.brandId === 'string' ? new ObjectId(productData.brandId) : productData.brandId,
    subBrandId: productData.subBrandId ? (typeof productData.subBrandId === 'string' ? new ObjectId(productData.subBrandId) : productData.subBrandId) : null,
    name: productData.name || null,
    sku: productData.sku || null,
    mrp: typeof productData.mrp === 'number' ? productData.mrp : parseFloat(productData.mrp || 0),
    hsnCode: productData.hsnCode || null,
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    organizationId: productData.organizationId ? (typeof productData.organizationId === 'string' ? new ObjectId(productData.organizationId) : productData.organizationId) : null,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(product);
  return { ...product, _id: result.insertedId };
}

export async function getRetailProductById(id) {
  const collection = await getRetailProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getRetailProductBySku(organizationId, sku) {
  const collection = await getRetailProductCollection();
  const orgId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
  return await collection.findOne({ organizationId: orgId, sku });
}

export async function getAllRetailProducts(filter = {}) {
  const collection = await getRetailProductCollection();
  // Convert ObjectIds in filter
  const queryFilter = { ...filter };
  if (queryFilter.brandId && typeof queryFilter.brandId === 'string') {
    queryFilter.brandId = new ObjectId(queryFilter.brandId);
  }
  if (queryFilter.subBrandId && typeof queryFilter.subBrandId === 'string') {
    queryFilter.subBrandId = new ObjectId(queryFilter.subBrandId);
  }
  if (queryFilter.organizationId && typeof queryFilter.organizationId === 'string') {
    queryFilter.organizationId = new ObjectId(queryFilter.organizationId);
  }
  return await collection.find(queryFilter).sort({ createdAt: -1 }).toArray();
}

export async function updateRetailProduct(id, updateData) {
  const collection = await getRetailProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.brandId && typeof update.brandId === 'string') {
    update.brandId = new ObjectId(update.brandId);
  }
  if (update.subBrandId && typeof update.subBrandId === 'string') {
    update.subBrandId = new ObjectId(update.subBrandId);
  }
  if (update.organizationId && typeof update.organizationId === 'string') {
    update.organizationId = new ObjectId(update.organizationId);
  }
  if (update.mrp) {
    update.mrp = typeof update.mrp === 'number' ? update.mrp : parseFloat(update.mrp);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteRetailProduct(id) {
  const collection = await getRetailProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

