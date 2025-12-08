// models/LensRxRange.js
// MongoDB model for LensRxRange (V2 Spec - multiple RX ranges per lens)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getLensRxRangeCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('lensRxRanges');
}

export async function createLensRxRange(rangeData) {
  const collection = await getLensRxRangeCollection();
  const now = new Date();
  
  const range = {
    lensId: typeof rangeData.lensId === 'string' ? new ObjectId(rangeData.lensId) : rangeData.lensId,
    sphMin: typeof rangeData.sphMin === 'number' ? rangeData.sphMin : parseFloat(rangeData.sphMin),
    sphMax: typeof rangeData.sphMax === 'number' ? rangeData.sphMax : parseFloat(rangeData.sphMax),
    cylMin: typeof rangeData.cylMin === 'number' ? rangeData.cylMin : parseFloat(rangeData.cylMin || 0),
    cylMax: typeof rangeData.cylMax === 'number' ? rangeData.cylMax : parseFloat(rangeData.cylMax),
    addOnPrice: typeof rangeData.addOnPrice === 'number' ? rangeData.addOnPrice : parseFloat(rangeData.addOnPrice || 0),
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(range);
  return { ...range, _id: result.insertedId };
}

export async function getLensRxRangeById(id) {
  const collection = await getLensRxRangeCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objectId });
}

export async function getLensRxRangesByLens(lensId) {
  const collection = await getLensRxRangeCollection();
  const lId = typeof lensId === 'string' ? new ObjectId(lensId) : lensId;
  return await collection.find({ lensId: lId }).sort({ sphMin: 1 }).toArray();
}

export async function updateLensRxRange(id, updateData) {
  const collection = await getLensRxRangeCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  
  // Convert numeric fields
  if (update.sphMin !== undefined) update.sphMin = typeof update.sphMin === 'number' ? update.sphMin : parseFloat(update.sphMin);
  if (update.sphMax !== undefined) update.sphMax = typeof update.sphMax === 'number' ? update.sphMax : parseFloat(update.sphMax);
  if (update.cylMin !== undefined) update.cylMin = typeof update.cylMin === 'number' ? update.cylMin : parseFloat(update.cylMin || 0);
  if (update.cylMax !== undefined) update.cylMax = typeof update.cylMax === 'number' ? update.cylMax : parseFloat(update.cylMax);
  if (update.addOnPrice !== undefined) update.addOnPrice = typeof update.addOnPrice === 'number' ? update.addOnPrice : parseFloat(update.addOnPrice || 0);
  
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteLensRxRange(id) {
  const collection = await getLensRxRangeCollection();
  const objectId = typeof id === 'string' ? new ObjectId(id) : id;
  return await collection.deleteOne({ _id: objectId });
}

export async function deleteLensRxRangesByLens(lensId) {
  const collection = await getLensRxRangeCollection();
  const lId = typeof lensId === 'string' ? new ObjectId(lensId) : lensId;
  return await collection.deleteMany({ lensId: lId });
}

export async function syncLensRxRanges(lensId, ranges) {
  // Delete existing ranges
  await deleteLensRxRangesByLens(lensId);
  
  // Create new ranges
  if (ranges && ranges.length > 0) {
    const createPromises = ranges.map(range => 
      createLensRxRange({
        ...range,
        lensId
      })
    );
    await Promise.all(createPromises);
  }
  
  // Return updated ranges
  return await getLensRxRangesByLens(lensId);
}

