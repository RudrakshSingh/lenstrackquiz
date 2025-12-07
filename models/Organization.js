// models/Organization.js
// MongoDB model for Organization

import { getDatabase } from '../lib/mongodb';

export async function getOrganizationCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('organizations');
}

export async function createOrganization(orgData) {
  const collection = await getOrganizationCollection();
  const now = new Date();
  const organization = {
    ...orgData,
    isActive: orgData.isActive !== undefined ? orgData.isActive : true,
    settings: orgData.settings || {},
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(organization);
  return { ...organization, _id: result.insertedId };
}

export async function getOrganizationById(id) {
  const collection = await getOrganizationCollection();
  return await collection.findOne({ _id: id });
}

export async function getOrganizationByCode(code) {
  const collection = await getOrganizationCollection();
  return await collection.findOne({ code });
}

export async function getAllOrganizations(filter = {}) {
  const collection = await getOrganizationCollection();
  return await collection.find(filter).toArray();
}

export async function updateOrganization(id, updateData) {
  const collection = await getOrganizationCollection();
  const update = {
    ...updateData,
    updatedAt: new Date()
  };
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteOrganization(id) {
  const collection = await getOrganizationCollection();
  return await collection.deleteOne({ _id: id });
}
