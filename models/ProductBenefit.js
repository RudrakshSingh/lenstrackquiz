// models/ProductBenefit.js
// MongoDB model for Product-Benefit junction with scores

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getProductBenefitCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('productBenefits');
}

export async function createProductBenefit(productBenefitData) {
  const collection = await getProductBenefitCollection();
  const productBenefit = {
    productId: typeof productBenefitData.productId === 'string' ? new ObjectId(productBenefitData.productId) : productBenefitData.productId,
    benefitId: typeof productBenefitData.benefitId === 'string' ? new ObjectId(productBenefitData.benefitId) : productBenefitData.benefitId,
    score: typeof productBenefitData.score === 'number' ? productBenefitData.score : parseFloat(productBenefitData.score)
  };
  const result = await collection.insertOne(productBenefit);
  return { ...productBenefit, _id: result.insertedId };
}

export async function getProductBenefitsByProduct(productId) {
  const collection = await getProductBenefitCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.find({ productId: pId }).toArray();
}

export async function deleteProductBenefitsByProduct(productId) {
  const collection = await getProductBenefitCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  return await collection.deleteMany({ productId: pId });
}

export async function syncProductBenefits(productId, benefits) {
  const collection = await getProductBenefitCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  
  // Delete existing
  await collection.deleteMany({ productId: pId });
  
  // Insert new
  if (benefits && benefits.length > 0) {
    const { getBenefitByCode } = await import('./Benefit');
    const benefitRecords = [];
    for (const benefit of benefits) {
      const benefitDoc = await getBenefitByCode(benefit.benefitCode);
      if (benefitDoc) {
        benefitRecords.push({
          productId: pId,
          benefitId: benefitDoc._id,
          score: typeof benefit.score === 'number' ? benefit.score : parseFloat(benefit.score)
        });
      }
    }
    if (benefitRecords.length > 0) {
      await collection.insertMany(benefitRecords);
    }
  }
  
  return await getProductBenefitsByProduct(productId);
}

