// models/Offer.js
// MongoDB schema/model for Dynamic Offers

import { ObjectId } from 'mongodb';

export const OfferSchema = {
  // Basic Info
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  
  // Offer Type
  type: {
    type: String,
    required: true,
    enum: ['bogo', 'b1g1', 'bogo_50', 'b1g50', 'yopo', 'buy_x_get_y', 
           'lens_frame_free', 'frame_lens_free', 'fixed_discount', 'conditional_mix']
  },
  
  // Description (Multi-language)
  description: {
    en: { type: String, required: true },
    hi: { type: String, default: '' },
    hinglish: { type: String, default: '' }
  },
  
  // Target Filters
  target_filters: {
    brands: { type: [String], default: [] },
    vision_types: { type: [String], default: [] },
    lens_categories: { type: [String], default: [] },
    price_segments: { type: [String], default: [] },
    frame_brands: { type: [String], default: [] },
    min_cart_value: { type: Number, default: 0 },
    required_pairs: { type: Number, default: 1 }
  },
  
  // Discount Logic (varies by offer type)
  discount_logic: { type: Object, default: {} },
  
  // Validity
  validity: {
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null }
  },
  
  // Priority (for ranking)
  priority: { type: Number, default: 50, min: 0, max: 100 },
  
  // Stacking Rules
  stacking: {
    can_stack: { type: Boolean, default: false },
    blocked_with: { type: [String], default: [] }
  },
  
  // Upsell Templates (Multi-language)
  creative_upsell_templates: {
    product_footer: {
      en: { type: String, default: '' },
      hi: { type: String, default: '' },
      hinglish: { type: String, default: '' }
    },
    cart_banner: {
      en: { type: String, default: '' },
      hi: { type: String, default: '' },
      hinglish: { type: String, default: '' }
    }
  },
  
  // Status
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};

// Helper function to get offer collection
export async function getOfferCollection() {
  const { getDatabase } = await import('../lib/mongodb.js');
  const db = await getDatabase('lensquiz');
  return db.collection('offers');
}

// Helper functions for CRUD operations
export async function createOffer(offerData) {
  const collection = await getOfferCollection();
  const now = new Date();
  const offer = {
    ...offerData,
    created_at: now,
    updated_at: now
  };
  const result = await collection.insertOne(offer);
  return { ...offer, _id: result.insertedId };
}

export async function getAllOffers(filter = {}) {
  const collection = await getOfferCollection();
  return await collection.find(filter).sort({ priority: -1, created_at: -1 }).toArray();
}

export async function getActiveOffers() {
  const collection = await getOfferCollection();
  const now = new Date();
  return await collection.find({
    is_active: true,
    $and: [
      {
        $or: [
          { 'validity.start_date': { $lte: now } },
          { 'validity.start_date': null },
          { 'validity.start_date': { $exists: false } }
        ]
      },
      {
        $or: [
          { 'validity.end_date': { $gte: now } },
          { 'validity.end_date': null },
          { 'validity.end_date': { $exists: false } }
        ]
      }
    ]
  }).sort({ priority: -1 }).toArray();
}

export async function getOfferById(id) {
  const collection = await getOfferCollection();
  return await collection.findOne({ id: id });
}

export async function updateOffer(id, updateData) {
  const collection = await getOfferCollection();
  const update = {
    ...updateData,
    updated_at: new Date()
  };
  const result = await collection.findOneAndUpdate(
    { id: id },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteOffer(id) {
  const collection = await getOfferCollection();
  return await collection.deleteOne({ id: id });
}

