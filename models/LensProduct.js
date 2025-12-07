// models/LensProduct.js
// MongoDB model for Lens Product (enhanced version matching Prisma spec)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const BrandLine = {
  LENSTRACK: 'LENSTRACK',
  KODAK: 'KODAK',
  ZEISS: 'ZEISS'
};

export const VisionType = {
  SINGLE_VISION: 'SINGLE_VISION',
  PROGRESSIVE: 'PROGRESSIVE',
  BIFOCAL: 'BIFOCAL',
  ANTI_FATIGUE: 'ANTI_FATIGUE',
  MYOPIA_CONTROL: 'MYOPIA_CONTROL'
};

export const LensIndex = {
  INDEX_156: 'INDEX_156',
  INDEX_160: 'INDEX_160',
  INDEX_167: 'INDEX_167',
  INDEX_174: 'INDEX_174'
};

export const TintOption = {
  CLEAR: 'CLEAR',
  TINT: 'TINT',
  PHOTOCHROMIC: 'PHOTOCHROMIC'
};

export const SpecificationGroup = {
  OPTICAL_DESIGN: 'OPTICAL_DESIGN',
  MATERIAL: 'MATERIAL',
  COATING: 'COATING',
  INDEX_USAGE: 'INDEX_USAGE',
  LIFESTYLE_TAG: 'LIFESTYLE_TAG'
};

export async function getLensProductCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('lensProducts');
}

export async function createLensProduct(productData) {
  const collection = await getLensProductCollection();
  const now = new Date();
  const product = {
    itCode: productData.itCode,
    name: productData.name,
    brandLine: productData.brandLine,
    visionType: productData.visionType,
    lensIndex: productData.lensIndex,
    tintOption: productData.tintOption || TintOption.CLEAR,
    mrp: typeof productData.mrp === 'number' ? productData.mrp : parseFloat(productData.mrp),
    offerPrice: typeof productData.offerPrice === 'number' ? productData.offerPrice : parseFloat(productData.offerPrice),
    addOnPrice: productData.addOnPrice ? (typeof productData.addOnPrice === 'number' ? productData.addOnPrice : parseFloat(productData.addOnPrice)) : null,
    sphMin: typeof productData.sphMin === 'number' ? productData.sphMin : parseFloat(productData.sphMin),
    sphMax: typeof productData.sphMax === 'number' ? productData.sphMax : parseFloat(productData.sphMax),
    cylMax: typeof productData.cylMax === 'number' ? productData.cylMax : parseFloat(productData.cylMax),
    addMin: productData.addMin ? (typeof productData.addMin === 'number' ? productData.addMin : parseFloat(productData.addMin)) : null,
    addMax: productData.addMax ? (typeof productData.addMax === 'number' ? productData.addMax : parseFloat(productData.addMax)) : null,
    deliveryDays: productData.deliveryDays || 4,
    warranty: productData.warranty || null,
    yopoEligible: productData.yopoEligible !== undefined ? productData.yopoEligible : true,
    // Rx Band Pricing - array of pricing bands based on SPH/CYL ranges
    rxBands: productData.rxBands || [],
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(product);
  return { ...product, _id: result.insertedId };
}

export async function getLensProductById(id) {
  const collection = await getLensProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getLensProductByItCode(itCode) {
  const collection = await getLensProductCollection();
  return await collection.findOne({ itCode });
}

export async function getAllLensProducts(filter = {}) {
  const collection = await getLensProductCollection();
  return await collection.find(filter).toArray();
}

export async function getActiveLensProducts(filter = {}) {
  const collection = await getLensProductCollection();
  return await collection.find({ ...filter, isActive: true }).toArray();
}

export async function updateLensProduct(id, updateData) {
  const collection = await getLensProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  // Convert numeric fields
  if (update.mrp !== undefined) update.mrp = typeof update.mrp === 'number' ? update.mrp : parseFloat(update.mrp);
  if (update.offerPrice !== undefined) update.offerPrice = typeof update.offerPrice === 'number' ? update.offerPrice : parseFloat(update.offerPrice);
  if (update.sphMin !== undefined) update.sphMin = typeof update.sphMin === 'number' ? update.sphMin : parseFloat(update.sphMin);
  if (update.sphMax !== undefined) update.sphMax = typeof update.sphMax === 'number' ? update.sphMax : parseFloat(update.sphMax);
  if (update.cylMax !== undefined) update.cylMax = typeof update.cylMax === 'number' ? update.cylMax : parseFloat(update.cylMax);
  
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteLensProduct(id) {
  const collection = await getLensProductCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

