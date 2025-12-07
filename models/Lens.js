// models/Lens.js
// MongoDB schema/model for Lens

import { ObjectId } from 'mongodb';

export const LensSchema = {
  // Basic Info
  name: { type: String, required: true },
  brand: { type: String, default: 'Eyekra' },
  
  // Vision & Power
  vision_type: { 
    type: String, 
    required: true,
    enum: ['SV', 'SV_DISTANCE', 'SV_NEAR', 'SV_BIFOCAL_PAIR', 'progressive', 'bifocal', 'zero_power', 'ZERO_POWER', 'PROGRESSIVE', 'BIFOCAL']
  },
  vision_types_supported: { type: [String], default: [] }, // Array of supported vision types
  index: { 
    type: Number, 
    required: true,
    enum: [1.50, 1.56, 1.60, 1.67, 1.74]
  },
  material: { type: String, default: 'CR-39' }, // CR-39, Polycarbonate, MR-8, etc.
  
  // Power Range (using Spherical Equivalent)
  min_power_se: { type: Number, default: -8 }, // Minimum Spherical Equivalent
  max_power_se: { type: Number, default: 8 },  // Maximum Spherical Equivalent
  min_power_supported: { type: Number, default: -8 }, // Legacy support
  max_power_supported: { type: Number, default: 8 },  // Legacy support
  
  // Frame Compatibility
  frame_compatibility: { 
    type: [String], 
    required: true,
    enum: ['full_rim_plastic', 'full_rim_metal', 'half_rim', 'semi_rimless', 'rimless', 'drilled']
  },
  frame_types_allowed: { type: [String], default: [] }, // Alias for frame_compatibility
  
  // Feature Levels (0-5)
  blue_protection_level: { type: Number, default: 0, min: 0, max: 5 },
  uv_protection_level: { type: Number, default: 0, min: 0, max: 5 },
  ar_level: { type: Number, default: 0, min: 0, max: 5 },
  driving_support_level: { type: Number, default: 0, min: 0, max: 5 },
  
  // Boolean Features
  photochromic: { type: Boolean, default: false },
  polarized: { type: Boolean, default: false },
  anti_fatigue: { type: Boolean, default: false },
  
  // Pricing
  price_mrp: { type: Number, required: true, min: 0 },
  numericPrice: { type: Number, min: 0 },
  price_segment: { 
    type: String, 
    required: true,
    enum: ['budget', 'mid', 'premium', 'ultra', 'economy', 'standard']
  },
  dailyCost: { type: String, default: '' },
  
  // Features & Tags
  features: { type: [String], default: [] },
  tags: { type: [String], default: [] }, // Business logic tags
  campaign_tags: { type: [String], default: [] }, // e.g., ["DIWALI_PROMO", "STUDENT_SPECIAL"]
  upsell_anchor: { type: Boolean, default: false }, // If true, this lens is good for upsell
  
  // Status
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};

// Helper function to get lens collection
export async function getLensCollection() {
  const { getDatabase } = await import('../lib/mongodb.js');
  const db = await getDatabase('lensquiz');
  return db.collection('lenses');
}

// Helper functions for CRUD operations
export async function createLens(lensData) {
  const collection = await getLensCollection();
  const now = new Date();
  const lens = {
    ...lensData,
    created_at: now,
    updated_at: now
  };
  const result = await collection.insertOne(lens);
  return { ...lens, _id: result.insertedId };
}

export async function getAllLenses(filter = {}) {
  const collection = await getLensCollection();
  return await collection.find(filter).sort({ created_at: -1 }).toArray();
}

export async function getLensById(id) {
  const collection = await getLensCollection();
  // Handle both ObjectId and string
  const objectId = id instanceof ObjectId ? id : new ObjectId(id);
  return await collection.findOne({ _id: objectId });
}

export async function updateLens(id, updateData) {
  const collection = await getLensCollection();
  const update = {
    ...updateData,
    updated_at: new Date()
  };
  // Handle both ObjectId and string
  const objectId = id instanceof ObjectId ? id : new ObjectId(id);
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteLens(id) {
  const collection = await getLensCollection();
  // Handle both ObjectId and string
  const objectId = id instanceof ObjectId ? id : new ObjectId(id);
  return await collection.deleteOne({ _id: objectId });
}

export async function getActiveLenses() {
  return await getAllLenses({ is_active: true });
}

