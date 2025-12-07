// models/Coupon.js
// MongoDB model for Coupon codes

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getCouponCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('coupons');
}

export async function createCoupon(couponData) {
  const collection = await getCouponCollection();
  const now = new Date();
  const coupon = {
    code: couponData.code,
    description: couponData.description || null,
    minCartValue: couponData.minCartValue ? (typeof couponData.minCartValue === 'number' ? couponData.minCartValue : parseFloat(couponData.minCartValue)) : null,
    maxUsagePerUser: couponData.maxUsagePerUser || null,
    maxUsageGlobal: couponData.maxUsageGlobal || null,
    discountType: couponData.discountType,
    discountValue: typeof couponData.discountValue === 'number' ? couponData.discountValue : parseFloat(couponData.discountValue),
    maxDiscount: couponData.maxDiscount ? (typeof couponData.maxDiscount === 'number' ? couponData.maxDiscount : parseFloat(couponData.maxDiscount)) : null,
    isActive: couponData.isActive !== undefined ? couponData.isActive : true,
    startDate: couponData.startDate ? new Date(couponData.startDate) : null,
    endDate: couponData.endDate ? new Date(couponData.endDate) : null,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(coupon);
  return { ...coupon, _id: result.insertedId };
}

export async function getCouponById(id) {
  const collection = await getCouponCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getCouponByCode(code) {
  const collection = await getCouponCollection();
  return await collection.findOne({ code });
}

export async function getAllCoupons(filter = {}) {
  const collection = await getCouponCollection();
  return await collection.find(filter).toArray();
}

export async function getActiveCoupons(filter = {}) {
  const collection = await getCouponCollection();
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
  return await collection.find(activeFilter).toArray();
}

export async function updateCoupon(id, updateData) {
  const collection = await getCouponCollection();
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

export async function deleteCoupon(id) {
  const collection = await getCouponCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

