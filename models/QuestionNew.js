// models/QuestionNew.js
// MongoDB model for Question matching Prisma spec

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const QuestionCategory = {
  USAGE: 'USAGE',
  PROBLEMS: 'PROBLEMS',
  ENVIRONMENT: 'ENVIRONMENT',
  LIFESTYLE: 'LIFESTYLE',
  BUDGET: 'BUDGET'
};

export const QuestionType = {
  SINGLE_SELECT: 'SINGLE_SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  SLIDER: 'SLIDER'
};

export async function getQuestionNewCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('questionsNew');
}

export async function createQuestionNew(questionData) {
  const collection = await getQuestionNewCollection();
  
  // Handle multilingual text - support both old format (string) and new format (object)
  let text;
  if (typeof questionData.text === 'string') {
    // Legacy format: convert string to multilingual object
    text = {
      en: questionData.text,
      hi: questionData.textHi || questionData.text,
      hiEn: questionData.textHiEn || questionData.text
    };
  } else if (questionData.text && typeof questionData.text === 'object') {
    // New format: use multilingual object directly
    text = {
      en: questionData.text.en || questionData.text.textEn || '',
      hi: questionData.text.hi || questionData.text.textHi || '',
      hiEn: questionData.text.hiEn || questionData.text.textHiEn || questionData.text.hi || questionData.text.textHi || ''
    };
  } else {
    // Fallback: use separate fields if provided
    text = {
      en: questionData.textEn || questionData.text?.en || '',
      hi: questionData.textHi || questionData.text?.hi || '',
      hiEn: questionData.textHiEn || questionData.text?.hiEn || questionData.textHi || ''
    };
  }
  
  const question = {
    code: questionData.code,
    text: text,
    category: questionData.category,
    questionType: questionData.questionType,
    displayOrder: questionData.displayOrder || 0,
    isActive: questionData.isActive !== undefined ? questionData.isActive : true,
    parentAnswerId: questionData.parentAnswerId ? (typeof questionData.parentAnswerId === 'string' ? new ObjectId(questionData.parentAnswerId) : questionData.parentAnswerId) : null
  };
  const result = await collection.insertOne(question);
  return { ...question, _id: result.insertedId };
}

export async function getQuestionNewById(id) {
  const collection = await getQuestionNewCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getQuestionNewByCode(code) {
  const collection = await getQuestionNewCollection();
  return await collection.findOne({ code });
}

export async function getAllQuestionsNew(filter = {}) {
  const collection = await getQuestionNewCollection();
  return await collection.find(filter).sort({ displayOrder: 1 }).toArray();
}

export async function updateQuestionNew(id, updateData) {
  const collection = await getQuestionNewCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = { ...updateData };
  
  // Handle multilingual text update
  if (update.text !== undefined) {
    if (typeof update.text === 'string') {
      // Legacy format: convert string to multilingual object
      update.text = {
        en: update.text,
        hi: update.textHi || update.text,
        hiEn: update.textHiEn || update.text
      };
    } else if (update.text && typeof update.text === 'object') {
      // New format: ensure all fields are present
      update.text = {
        en: update.text.en || update.text.textEn || '',
        hi: update.text.hi || update.text.textHi || '',
        hiEn: update.text.hiEn || update.text.textHiEn || update.text.hi || update.text.textHi || ''
      };
    } else if (update.textEn || update.textHi || update.textHiEn) {
      // Separate fields provided
      update.text = {
        en: update.textEn || '',
        hi: update.textHi || '',
        hiEn: update.textHiEn || update.textHi || ''
      };
    }
  }
  
  // Remove separate text fields if they exist (they're now in text object)
  delete update.textEn;
  delete update.textHi;
  delete update.textHiEn;
  
  if (update.parentAnswerId && typeof update.parentAnswerId === 'string') {
    update.parentAnswerId = new ObjectId(update.parentAnswerId);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteQuestionNew(id) {
  const collection = await getQuestionNewCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}
