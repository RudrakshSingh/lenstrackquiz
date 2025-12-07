// models/OfferRule.js
// MongoDB model for Offer Rules

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const OfferType = {
  YOPO: 'YOPO',
  COMBO_PRICE: 'COMBO_PRICE',
  FREE_LENS: 'FREE_LENS',
  PERCENT_OFF: 'PERCENT_OFF',
  FLAT_OFF: 'FLAT_OFF',
  BOG50: 'BOG50',
  CATEGORY_DISCOUNT: 'CATEGORY_DISCOUNT',
  BONUS_FREE_PRODUCT: 'BONUS_FREE_PRODUCT'
};

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT_AMOUNT: 'FLAT_AMOUNT',
  YOPO_LOGIC: 'YOPO_LOGIC',
  FREE_ITEM: 'FREE_ITEM',
  COMBO_PRICE: 'COMBO_PRICE'
};

export async function getOfferRuleCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('offerRules');
}

export async function createOfferRule(offerData) {
  const collection = await getOfferRuleCollection();
  const now = new Date();
  const offer = {
    name: offerData.name,
    code: offerData.code,
    offerType: offerData.offerType,
    frameBrand: offerData.frameBrand || null, // Legacy support
    frameBrands: offerData.frameBrands || (offerData.frameBrand ? [offerData.frameBrand] : []), // V2: Array
    frameSubCategory: offerData.frameSubCategory || null, // Legacy support
    frameSubCategories: offerData.frameSubCategories || (offerData.frameSubCategory ? [offerData.frameSubCategory] : []), // V2: Array
    minFrameMRP: offerData.minFrameMRP ? (typeof offerData.minFrameMRP === 'number' ? offerData.minFrameMRP : parseFloat(offerData.minFrameMRP)) : null,
    maxFrameMRP: offerData.maxFrameMRP ? (typeof offerData.maxFrameMRP === 'number' ? offerData.maxFrameMRP : parseFloat(offerData.maxFrameMRP)) : null,
    lensBrandLines: offerData.lensBrandLines || [],
    lensItCodes: offerData.lensItCodes || [],
    discountType: offerData.discountType,
    discountValue: typeof offerData.discountValue === 'number' ? offerData.discountValue : parseFloat(offerData.discountValue),
    comboPrice: offerData.comboPrice ? (typeof offerData.comboPrice === 'number' ? offerData.comboPrice : parseFloat(offerData.comboPrice)) : null,
    config: offerData.config ? (typeof offerData.config === 'string' ? offerData.config : JSON.stringify(offerData.config)) : null,
    freeProductId: offerData.freeProductId ? (typeof offerData.freeProductId === 'string' ? new ObjectId(offerData.freeProductId) : offerData.freeProductId) : null,
    isSecondPairRule: offerData.isSecondPairRule !== undefined ? offerData.isSecondPairRule : false,
    secondPairPercent: offerData.secondPairPercent ? (typeof offerData.secondPairPercent === 'number' ? offerData.secondPairPercent : parseFloat(offerData.secondPairPercent)) : null,
    priority: offerData.priority || 100,
    isActive: offerData.isActive !== undefined ? offerData.isActive : true,
    startDate: offerData.startDate ? new Date(offerData.startDate) : null,
    endDate: offerData.endDate ? new Date(offerData.endDate) : null,
    // Upsell fields
    upsellEnabled: offerData.upsellEnabled !== undefined ? offerData.upsellEnabled : false,
    upsellThreshold: offerData.upsellThreshold ? (typeof offerData.upsellThreshold === 'number' ? offerData.upsellThreshold : parseFloat(offerData.upsellThreshold)) : null,
    upsellRewardText: offerData.upsellRewardText || null,
    freeProductName: offerData.freeProductName || null,
    freeProductValue: offerData.freeProductValue ? (typeof offerData.freeProductValue === 'number' ? offerData.freeProductValue : parseFloat(offerData.freeProductValue)) : null,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(offer);
  return { ...offer, _id: result.insertedId };
}

export async function getOfferRuleById(id) {
  const collection = await getOfferRuleCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getOfferRuleByCode(code) {
  const collection = await getOfferRuleCollection();
  return await collection.findOne({ code });
}

export async function getAllOfferRules(filter = {}) {
  const collection = await getOfferRuleCollection();
  return await collection.find(filter).sort({ priority: -1 }).toArray();
}

export async function getActiveOfferRules(filter = {}) {
  const collection = await getOfferRuleCollection();
  const now = new Date();
  const activeFilter = {
    ...filter,
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: null },
          { startDate: { $lte: now } }
        ]
      },
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      }
    ]
  };
  return await collection.find(activeFilter).sort({ priority: -1 }).toArray();
}

export async function updateOfferRule(id, updateData) {
  const collection = await getOfferRuleCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.startDate) update.startDate = new Date(update.startDate);
  if (update.endDate) update.endDate = new Date(update.endDate);
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteOfferRule(id) {
  const collection = await getOfferRuleCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

