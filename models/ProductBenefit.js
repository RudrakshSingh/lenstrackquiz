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
    score: typeof productBenefitData.score === 'number' ? productBenefitData.score : parseFloat(productBenefitData.score || productBenefitData.points || 0)
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

export async function syncProductBenefits(productId, benefitScores) {
  const collection = await getProductBenefitCollection();
  const pId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  
  // Delete existing
  await collection.deleteMany({ productId: pId });
  
  // Insert new - benefitScores is an object like { "B01": 3, "B02": 2, ... }
  if (benefitScores && typeof benefitScores === 'object') {
    const { getBenefitByCode } = await import('./Benefit');
    const benefitRecords = [];
    
    for (const [benefitCode, score] of Object.entries(benefitScores)) {
      const benefitDoc = await getBenefitByCode(benefitCode);
      if (benefitDoc) {
        const scoreValue = typeof score === 'number' ? score : parseFloat(score || 0);
        // Save all benefits including 0 scores (V2 spec: 0-3 scale, ensures full B01-B12 mapping)
        benefitRecords.push({
          productId: pId,
          benefitId: benefitDoc._id,
          score: Math.max(0, Math.min(3, scoreValue)) // Clamp to 0-3 range
        });
      }
    }
    
    if (benefitRecords.length > 0) {
      await collection.insertMany(benefitRecords);
    }
  }
  
  return await getProductBenefitsByProduct(productId);
}

