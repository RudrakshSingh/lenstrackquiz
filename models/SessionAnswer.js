// models/SessionAnswer.js
// MongoDB model for SessionAnswer

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getSessionAnswerCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('sessionAnswers');
}

export async function createSessionAnswer(answerData) {
  const collection = await getSessionAnswerCollection();
  const now = new Date();
  const answer = {
    sessionId: typeof answerData.sessionId === 'string' 
      ? new ObjectId(answerData.sessionId) 
      : answerData.sessionId,
    questionId: typeof answerData.questionId === 'string' 
      ? new ObjectId(answerData.questionId) 
      : answerData.questionId,
    optionId: typeof answerData.optionId === 'string' 
      ? new ObjectId(answerData.optionId) 
      : answerData.optionId,
    answeredAt: answerData.answeredAt || now
  };
  const result = await collection.insertOne(answer);
  return { ...answer, _id: result.insertedId };
}

export async function getSessionAnswersBySession(sessionId) {
  const collection = await getSessionAnswerCollection();
  const sId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
  return await collection.find({ sessionId: sId }).toArray();
}

export async function getSessionAnswer(sessionId, questionId) {
  const collection = await getSessionAnswerCollection();
  const sId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
  const qId = typeof questionId === 'string' ? new ObjectId(questionId) : questionId;
  return await collection.findOne({ sessionId: sId, questionId: qId });
}

export async function deleteSessionAnswersBySession(sessionId) {
  const collection = await getSessionAnswerCollection();
  const sId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
  return await collection.deleteMany({ sessionId: sId });
}
