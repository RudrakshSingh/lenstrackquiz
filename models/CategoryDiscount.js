// models/CategoryDiscount.js
// MongoDB model for Category Discounts

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const CustomerCategory = {
  STUDENT: 'STUDENT',
  DOCTOR: 'DOCTOR',
  TEACHER: 'TEACHER',
  ARMED_FORCES: 'ARMED_FORCES',
  SENIOR_CITIZEN: 'SENIOR_CITIZEN',
  CORPORATE: 'CORPORATE'
};

export async function getCategoryDiscountCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('categoryDiscounts');
}

export async function createCategoryDiscount(discountData) {
  const collection = await getCategoryDiscountCollection();
  const discount = {
    customerCategory: discountData.customerCategory,
    brandCode: discountData.brandCode,
    discountPercent: typeof discountData.discountPercent === 'number' ? discountData.discountPercent : parseFloat(discountData.discountPercent),
    maxDiscount: discountData.maxDiscount ? (typeof discountData.maxDiscount === 'number' ? discountData.maxDiscount : parseFloat(discountData.maxDiscount)) : null,
    isActive: discountData.isActive !== undefined ? discountData.isActive : true
  };
  const result = await collection.insertOne(discount);
  return { ...discount, _id: result.insertedId };
}

export async function getCategoryDiscountById(id) {
  const collection = await getCategoryDiscountCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getCategoryDiscountByCategoryAndBrand(customerCategory, brandCode) {
  const collection = await getCategoryDiscountCollection();
  return await collection.findOne({ customerCategory, brandCode });
}

export async function getAllCategoryDiscounts(filter = {}) {
  const collection = await getCategoryDiscountCollection();
  return await collection.find(filter).toArray();
}

export async function getActiveCategoryDiscounts(filter = {}) {
  const collection = await getCategoryDiscountCollection();
  return await collection.find({ ...filter, isActive: true }).toArray();
}

export async function updateCategoryDiscount(id, updateData) {
  const collection = await getCategoryDiscountCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteCategoryDiscount(id) {
  const collection = await getCategoryDiscountCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

