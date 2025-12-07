// models/StoreProduct.js
// MongoDB model for StoreProduct

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getStoreProductCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('storeProducts');
}

export async function createStoreProduct(storeProductData) {
  const collection = await getStoreProductCollection();
  const now = new Date();
  const storeProduct = {
    storeId: typeof storeProductData.storeId === 'string' 
      ? new ObjectId(storeProductData.storeId) 
      : storeProductData.storeId,
    productId: typeof storeProductData.productId === 'string' 
      ? new ObjectId(storeProductData.productId) 
      : storeProductData.productId,
    stockQuantity: storeProductData.stockQuantity || 0,
    priceOverride: storeProductData.priceOverride 
      ? (typeof storeProductData.priceOverride === 'number' 
          ? storeProductData.priceOverride 
          : parseFloat(storeProductData.priceOverride))
      : null,
    isAvailable: storeProductData.isAvailable !== undefined ? storeProductData.isAvailable : true,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(storeProduct);
  return { ...storeProduct, _id: result.insertedId };
}

export async function getStoreProduct(storeId, productId) {
  const collection = await getStoreProductCollection();
  const sId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.findOne({ storeId: sId, productId: pId });
}

export async function getStoreProductsByStore(storeId) {
  const collection = await getStoreProductCollection();
  const sId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
  return await collection.find({ storeId: sId }).toArray();
}

export async function getStoreProductsByProduct(productId) {
  const collection = await getStoreProductCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.find({ productId: pId }).toArray();
}

export async function updateStoreProduct(storeId, productId, updateData) {
  const collection = await getStoreProductCollection();
  const sId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.priceOverride && typeof update.priceOverride === 'string') {
    update.priceOverride = parseFloat(update.priceOverride);
  }
  const result = await collection.findOneAndUpdate(
    { storeId: sId, productId: pId },
    { $set: update },
    { returnDocument: 'after', upsert: true }
  );
  return result.value;
}

export async function deleteStoreProduct(storeId, productId) {
  const collection = await getStoreProductCollection();
  const sId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.deleteOne({ storeId: sId, productId: pId });
}
