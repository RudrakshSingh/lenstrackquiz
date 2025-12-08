// models/AnswerNew.js
// MongoDB model for Answer matching Prisma spec

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getAnswerNewCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('answersNew');
}

export async function createAnswerNew(answerData) {
  const collection = await getAnswerNewCollection();
  
  // Handle multilingual text - support both old format (string) and new format (object)
  let text;
  if (typeof answerData.text === 'string') {
    // Legacy format: convert string to multilingual object
    text = {
      en: answerData.text,
      hi: answerData.textHi || answerData.text,
      hiEn: answerData.textHiEn || answerData.text
    };
  } else if (answerData.text && typeof answerData.text === 'object') {
    // New format: use multilingual object directly
    text = {
      en: answerData.text.en || answerData.text.textEn || '',
      hi: answerData.text.hi || answerData.text.textHi || '',
      hiEn: answerData.text.hiEn || answerData.text.textHiEn || answerData.text.hi || answerData.text.textHi || ''
    };
  } else {
    // Fallback: use separate fields if provided
    text = {
      en: answerData.textEn || answerData.text?.en || '',
      hi: answerData.textHi || answerData.text?.hi || '',
      hiEn: answerData.textHiEn || answerData.text?.hiEn || answerData.textHi || ''
    };
  }
  
  const answer = {
    questionId: typeof answerData.questionId === 'string' ? new ObjectId(answerData.questionId) : answerData.questionId,
    text: text,
    displayOrder: answerData.displayOrder !== undefined ? answerData.displayOrder : 0,
    isActive: answerData.isActive !== undefined ? answerData.isActive : true,
    triggersSubQuestion: answerData.triggersSubQuestion || false,
    subQuestionId: answerData.subQuestionId ? (typeof answerData.subQuestionId === 'string' ? new ObjectId(answerData.subQuestionId) : answerData.subQuestionId) : null
  };
  const result = await collection.insertOne(answer);
  return { ...answer, _id: result.insertedId };
}

export async function getAnswerNewById(id) {
  const collection = await getAnswerNewCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getAnswersByQuestion(questionId) {
  const collection = await getAnswerNewCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.find({ questionId: qId }).sort({ displayOrder: 1 }).toArray();
}

export async function updateAnswerNew(id, updateData) {
  const collection = await getAnswerNewCollection();
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
  
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteAnswerNew(id) {
  const collection = await getAnswerNewCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function deleteAnswersByQuestion(questionId) {
  const collection = await getAnswerNewCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.deleteMany({ questionId: qId });
}

