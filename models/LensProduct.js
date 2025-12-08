// models/LensProduct.js
// MongoDB model for Lens Product (V2 Architecture - matches spec)
// Lens Products use LensBrand (not ProductBrand)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

// Vision Type (V2 Spec)
export const VisionType = {
  SINGLE_VISION: 'SINGLE_VISION',
  PROGRESSIVE: 'PROGRESSIVE',
  BIFOCAL: 'BIFOCAL',
  ANTI_FATIGUE: 'ANTI_FATIGUE',
  MYOPIA_CONTROL: 'MYOPIA_CONTROL'
};

// Lens Index (V2 Spec)
export const LensIndex = {
  INDEX_156: 'INDEX_156',
  INDEX_160: 'INDEX_160',
  INDEX_167: 'INDEX_167',
  INDEX_174: 'INDEX_174'
};

// Tint Option (V2 Spec)
export const TintOption = {
  CLEAR: 'CLEAR',
  TINT: 'TINT',
  PHOTOCHROMIC: 'PHOTOCHROMIC',
  TRANSITION: 'TRANSITION'
};

// Lens Category (V2 Spec)
export const LensCategory = {
  ECONOMY: 'ECONOMY',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  ULTRA: 'ULTRA'
};

// Legacy support - alias for backward compatibility
export const LensType = VisionType;

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
  
  // V2 Spec: brandLine is a string (not ObjectId reference)
  const product = {
    itCode: productData.itCode,
    name: productData.name,
    brandLine: productData.brandLine || productData.lensBrandId?.toString() || '', // V2: brandLine as string
    visionType: productData.visionType || productData.type, // V2: visionType
    lensIndex: productData.lensIndex || productData.index, // V2: lensIndex
    tintOption: productData.tintOption || TintOption.CLEAR, // V2: tintOption
    category: productData.category || LensCategory.STANDARD, // V2: category
    baseOfferPrice: typeof productData.baseOfferPrice === 'number' ? productData.baseOfferPrice : parseFloat(productData.baseOfferPrice || productData.offerPrice || 0), // V2: baseOfferPrice
    addOnPrice: productData.addOnPrice ? (typeof productData.addOnPrice === 'number' ? productData.addOnPrice : parseFloat(productData.addOnPrice)) : 0, // V2: addOnPrice
    deliveryDays: productData.deliveryDays || 4,
    yopoEligible: productData.yopoEligible !== undefined ? productData.yopoEligible : true,
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  
  // Support legacy fields for backward compatibility
  if (productData.lensBrandId && !productData.brandLine) {
    product.lensBrandId = typeof productData.lensBrandId === 'string' ? new ObjectId(productData.lensBrandId) : productData.lensBrandId;
  }
  if (productData.mrp) {
    product.mrp = typeof productData.mrp === 'number' ? productData.mrp : parseFloat(productData.mrp);
  }
  if (productData.offerPrice && !productData.baseOfferPrice) {
    product.baseOfferPrice = typeof productData.offerPrice === 'number' ? productData.offerPrice : parseFloat(productData.offerPrice);
  }
  
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
  
  // Convert lensBrandId to ObjectId if provided
  if (update.lensBrandId && typeof update.lensBrandId === 'string') {
    update.lensBrandId = new ObjectId(update.lensBrandId);
  }
  
  // Handle rxRange conversion
  if (update.rxRange) {
    update.rxRange = {
      sphMin: typeof update.rxRange.sphMin === 'number' ? update.rxRange.sphMin : parseFloat(update.rxRange.sphMin || -10),
      sphMax: typeof update.rxRange.sphMax === 'number' ? update.rxRange.sphMax : parseFloat(update.rxRange.sphMax || 10),
      cylMax: typeof update.rxRange.cylMax === 'number' ? update.rxRange.cylMax : parseFloat(update.rxRange.cylMax || 6),
      addMin: update.rxRange.addMin ? (typeof update.rxRange.addMin === 'number' ? update.rxRange.addMin : parseFloat(update.rxRange.addMin)) : null,
      addMax: update.rxRange.addMax ? (typeof update.rxRange.addMax === 'number' ? update.rxRange.addMax : parseFloat(update.rxRange.addMax)) : null
    };
  }
  
  // Convert numeric fields
  if (update.mrp !== undefined) update.mrp = typeof update.mrp === 'number' ? update.mrp : parseFloat(update.mrp);
  if (update.offerPrice !== undefined) update.offerPrice = typeof update.offerPrice === 'number' ? update.offerPrice : parseFloat(update.offerPrice);
  if (update.addOnPrice !== undefined) {
    update.addOnPrice = update.addOnPrice ? (typeof update.addOnPrice === 'number' ? update.addOnPrice : parseFloat(update.addOnPrice)) : null;
  }
  
  // Legacy field support
  if (update.sphMin !== undefined) update.sphMin = typeof update.sphMin === 'number' ? update.sphMin : parseFloat(update.sphMin);
  if (update.sphMax !== undefined) update.sphMax = typeof update.sphMax === 'number' ? update.sphMax : parseFloat(update.sphMax);
  if (update.cylMax !== undefined) update.cylMax = typeof update.cylMax === 'number' ? update.cylMax : parseFloat(update.cylMax);
  
  // Support both old and new field names
  if (update.visionType && !update.type) update.type = update.visionType;
  if (update.lensIndex && !update.index) update.index = update.lensIndex;
  
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

