// models/Question.js
// MongoDB model for Question (updated to match LensTrack spec)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';
import { ProductCategory } from './Product';

export async function getQuestionCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('questions');
}

export async function createQuestion(questionData) {
  const collection = await getQuestionCollection();
  const now = new Date();
  const question = {
    organizationId: typeof questionData.organizationId === 'string' 
      ? new ObjectId(questionData.organizationId) 
      : questionData.organizationId,
    key: questionData.key,
    textEn: questionData.textEn || questionData.text?.en || '',
    textHi: questionData.textHi || questionData.text?.hi || null,
    textHiEn: questionData.textHiEn || questionData.text?.hinglish || null,
    category: questionData.category || ProductCategory.EYEGLASSES,
    order: questionData.order || 0,
    isRequired: questionData.isRequired !== undefined ? questionData.isRequired : true,
    allowMultiple: questionData.allowMultiple || false,
    showIf: questionData.showIf || null,
    isActive: questionData.isActive !== undefined ? questionData.isActive : true,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(question);
  return { ...question, _id: result.insertedId };
}

export async function getQuestionById(id) {
  const collection = await getQuestionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getQuestionByKey(organizationId, key) {
  const collection = await getQuestionCollection();
  const orgId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
  return await collection.findOne({ organizationId: orgId, key });
}

export async function getAllQuestions(filter = {}) {
  const collection = await getQuestionCollection();
  if (filter.organizationId && typeof filter.organizationId === 'string') {
    filter.organizationId = new ObjectId(filter.organizationId);
  }
  return await collection.find(filter).sort({ order: 1 }).toArray();
}

export async function updateQuestion(id, updateData) {
  const collection = await getQuestionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  if (update.organizationId && typeof update.organizationId === 'string') {
    update.organizationId = new ObjectId(update.organizationId);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteQuestion(id) {
  const collection = await getQuestionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}
