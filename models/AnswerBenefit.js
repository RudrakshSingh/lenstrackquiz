// models/AnswerBenefit.js
// MongoDB model for Answer-Benefit mapping

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getAnswerBenefitCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('answerBenefits');
}

export async function createAnswerBenefit(answerBenefitData) {
  const collection = await getAnswerBenefitCollection();
  const answerBenefit = {
    answerId: typeof answerBenefitData.answerId === 'string' ? new ObjectId(answerBenefitData.answerId) : answerBenefitData.answerId,
    benefitId: typeof answerBenefitData.benefitId === 'string' ? new ObjectId(answerBenefitData.benefitId) : answerBenefitData.benefitId,
    points: typeof answerBenefitData.points === 'number' ? answerBenefitData.points : parseFloat(answerBenefitData.points)
  };
  const result = await collection.insertOne(answerBenefit);
  return { ...answerBenefit, _id: result.insertedId };
}

export async function getAnswerBenefitsByAnswer(answerId) {
  const collection = await getAnswerBenefitCollection();
  const aId = typeof answerId === 'string' ? new ObjectId(answerId) : answerId;
  return await collection.find({ answerId: aId }).toArray();
}

export async function getAnswerBenefitsByAnswers(answerIds) {
  const collection = await getAnswerBenefitCollection();
  const aIds = answerIds.map(id => typeof id === 'string' ? new ObjectId(id) : id);
  return await collection.find({ answerId: { $in: aIds } }).toArray();
}

export async function deleteAnswerBenefitsByAnswer(answerId) {
  const collection = await getAnswerBenefitCollection();
  const aId = typeof answerId === 'string' ? new ObjectId(answerId) : answerId;
  return await collection.deleteMany({ answerId: aId });
}

export async function syncAnswerBenefits(answerId, benefits) {
  const collection = await getAnswerBenefitCollection();
  const aId = typeof answerId === 'string' ? new ObjectId(answerId) : answerId;
  
  // Delete existing
  await collection.deleteMany({ answerId: aId });
  
  // Insert new
  if (benefits && benefits.length > 0) {
    const { getBenefitByCode } = await import('./Benefit');
    const benefitRecords = [];
    for (const benefit of benefits) {
      const benefitDoc = await getBenefitByCode(benefit.benefitCode);
      if (benefitDoc) {
        benefitRecords.push({
          answerId: aId,
          benefitId: benefitDoc._id,
          points: typeof benefit.points === 'number' ? benefit.points : parseFloat(benefit.points)
        });
      }
    }
    if (benefitRecords.length > 0) {
      await collection.insertMany(benefitRecords);
    }
  }
  
  return await getAnswerBenefitsByAnswer(answerId);
}

