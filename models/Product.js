// models/Product.js
// MongoDB model for Product

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const ProductCategory = {
  EYEGLASSES: 'EYEGLASSES',
  SUNGLASSES: 'SUNGLASSES',
  CONTACT_LENSES: 'CONTACT_LENSES',
  ACCESSORIES: 'ACCESSORIES'
};

export async function getProductCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('products');
}

export async function createProduct(productData) {
  const collection = await getProductCollection();
  const now = new Date();
  
  // Clean up the data
  const cleanData = { ...productData };
  delete cleanData.features; // Remove features as they're handled separately
  
  const product = {
    ...cleanData,
    organizationId: typeof productData.organizationId === 'string' 
      ? new ObjectId(productData.organizationId) 
      : productData.organizationId,
    basePrice: typeof productData.basePrice === 'number' 
      ? productData.basePrice 
      : parseFloat(productData.basePrice || 0),
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  
  // Remove undefined/null/empty values for optional fields
  Object.keys(product).forEach(key => {
    if (product[key] === undefined || product[key] === null || product[key] === '') {
      delete product[key];
    }
  });
  
  const result = await collection.insertOne(product);
  return { ...product, _id: result.insertedId };
}

export async function getProductById(id) {
  const collection = await getProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getProductBySku(organizationId, sku) {
  const collection = await getProductCollection();
  const orgId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
  return await collection.findOne({ organizationId: orgId, sku });
}

export async function getAllProducts(filter = {}) {
  const collection = await getProductCollection();
  // Create a copy of filter to avoid mutating the original
  const queryFilter = { ...filter };
  if (queryFilter.organizationId && typeof queryFilter.organizationId === 'string') {
    queryFilter.organizationId = new ObjectId(queryFilter.organizationId);
  }
  return await collection.find(queryFilter).sort({ createdAt: -1 }).toArray();
}

export async function updateProduct(id, updateData) {
  const collection = await getProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.organizationId && typeof update.organizationId === 'string') {
    update.organizationId = new ObjectId(update.organizationId);
  }
  if (update.basePrice) {
    update.basePrice = typeof update.basePrice === 'number' 
      ? update.basePrice 
      : parseFloat(update.basePrice);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteProduct(id) {
  const collection = await getProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}
