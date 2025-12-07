// models/OfferApplicationLog.js
// MongoDB model for Offer Application Log (audit trail)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getOfferApplicationLogCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('offerApplicationLogs');
}

export async function createOfferApplicationLog(logData) {
  const collection = await getOfferApplicationLogCollection();
  const now = new Date();
  const log = {
    orderId: logData.orderId ? (typeof logData.orderId === 'string' ? new ObjectId(logData.orderId) : logData.orderId) : null,
    frameBrand: logData.frameBrand,
    frameMRP: typeof logData.frameMRP === 'number' ? logData.frameMRP : parseFloat(logData.frameMRP),
    lensItCode: logData.lensItCode,
    lensPrice: typeof logData.lensPrice === 'number' ? logData.lensPrice : parseFloat(logData.lensPrice),
    offersApplied: logData.offersApplied || {},
    finalPrice: typeof logData.finalPrice === 'number' ? logData.finalPrice : parseFloat(logData.finalPrice),
    createdAt: now
  };
  const result = await collection.insertOne(log);
  return { ...log, _id: result.insertedId };
}

export async function getOfferApplicationLogById(id) {
  const collection = await getOfferApplicationLogCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getAllOfferApplicationLogs(filter = {}) {
  const collection = await getOfferApplicationLogCollection();
  return await collection.find(filter).sort({ createdAt: -1 }).toArray();
}

