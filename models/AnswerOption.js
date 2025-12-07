// models/AnswerOption.js
// MongoDB model for AnswerOption

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getAnswerOptionCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('answerOptions');
}

export async function createAnswerOption(optionData) {
  const collection = await getAnswerOptionCollection();
  const option = {
    questionId: typeof optionData.questionId === 'string' 
      ? new ObjectId(optionData.questionId) 
      : optionData.questionId,
    key: optionData.key,
    textEn: optionData.textEn || optionData.label?.en || '',
    textHi: optionData.textHi || optionData.label?.hi || null,
    textHiEn: optionData.textHiEn || optionData.label?.hinglish || null,
    icon: optionData.icon || null,
    order: optionData.order || 0
  };
  const result = await collection.insertOne(option);
  return { ...option, _id: result.insertedId };
}

export async function getAnswerOptionById(id) {
  const collection = await getAnswerOptionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getAnswerOptionsByQuestion(questionId) {
  const collection = await getAnswerOptionCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.find({ questionId: qId }).sort({ order: 1 }).toArray();
}

export async function getAnswerOptionByKey(questionId, key) {
  const collection = await getAnswerOptionCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.findOne({ questionId: qId, key });
}

export async function updateAnswerOption(id, updateData) {
  const collection = await getAnswerOptionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = { ...updateData };
  if (update.questionId && typeof update.questionId === 'string') {
    update.questionId = new ObjectId(update.questionId);
  }
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteAnswerOption(id) {
  const collection = await getAnswerOptionCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function deleteAnswerOptionsByQuestion(questionId) {
  const collection = await getAnswerOptionCollection();
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.deleteMany({ questionId: qId });
}
