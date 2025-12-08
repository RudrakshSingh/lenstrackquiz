// scripts/seed-features-benefits.js
// Seed script for F01-F11 Features and B01-B12 Benefits

import { getDatabase } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

const FEATURES_SEED = [
  { code: 'F01', name: 'Crack Smudge & Scratch Resistant', category: 'DURABILITY', displayOrder: 1 },
  { code: 'F02', name: 'Anti-Reflection', category: 'COATING', displayOrder: 2 },
  { code: 'F03', name: 'Screen Protection (All Day)', category: 'PROTECTION', displayOrder: 3 },
  { code: 'F04', name: 'Dust Repellent', category: 'COATING', displayOrder: 4 },
  { code: 'F05', name: 'UV 400 + Sun Protection', category: 'PROTECTION', displayOrder: 5 },
  { code: 'F06', name: 'Hydrophobic & Oleophobic', category: 'COATING', displayOrder: 6 },
  { code: 'F07', name: 'Driving Protection', category: 'LIFESTYLE', displayOrder: 7 },
  { code: 'F08', name: '360° Digital Lifestyle', category: 'LIFESTYLE', displayOrder: 8 },
  { code: 'F09', name: 'Selfie Friendly', category: 'LIFESTYLE', displayOrder: 9 },
  { code: 'F10', name: '2.5× More Durable Coating', category: 'DURABILITY', displayOrder: 10 },
  { code: 'F11', name: 'Natural Color Perception', category: 'VISION', displayOrder: 11 }
];

const BENEFITS_SEED = [
  { code: 'B01', name: 'Digital Screen Protection', maxScore: 3.0 },
  { code: 'B02', name: 'Driving Comfort', maxScore: 3.0 },
  { code: 'B03', name: 'UV & Sun Protection', maxScore: 3.0 },
  { code: 'B04', name: 'Anti-Fatigue Relief', maxScore: 3.0 },
  { code: 'B05', name: 'Durability & Scratch Resist', maxScore: 3.0 },
  { code: 'B06', name: 'Water & Dust Repellent', maxScore: 3.0 },
  { code: 'B07', name: 'Crystal Clear Vision', maxScore: 3.0 },
  { code: 'B08', name: 'Photochromic / Light Adaptive', maxScore: 3.0 },
  { code: 'B09', name: 'Myopia Control', maxScore: 3.0 },
  { code: 'B10', name: 'Reading / Near Comfort', maxScore: 3.0 },
  { code: 'B11', name: 'All Distance Vision', maxScore: 3.0 },
  { code: 'B12', name: 'Natural Color Accuracy', maxScore: 3.0 }
];

async function seedFeatures() {
  const db = await getDatabase('lensquiz');
  const collection = db.collection('features');
  
  console.log('Seeding Features (F01-F11)...');
  
  for (const feature of FEATURES_SEED) {
    const existing = await collection.findOne({ code: feature.code });
    if (existing) {
      // Update existing
      await collection.updateOne(
        { code: feature.code },
        {
          $set: {
            name: feature.name,
            category: feature.category,
            displayOrder: feature.displayOrder,
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      console.log(`Updated feature ${feature.code}`);
    } else {
      // Insert new
      await collection.insertOne({
        ...feature,
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created feature ${feature.code}`);
    }
  }
  
  console.log('Features seeding complete!');
}

async function seedBenefits() {
  const db = await getDatabase('lensquiz');
  const collection = db.collection('benefits');
  
  console.log('Seeding Benefits (B01-B12)...');
  
  for (const benefit of BENEFITS_SEED) {
    const existing = await collection.findOne({ code: benefit.code });
    if (existing) {
      // Update existing
      await collection.updateOne(
        { code: benefit.code },
        {
          $set: {
            name: benefit.name,
            maxScore: benefit.maxScore,
            pointWeight: 1.0,
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      console.log(`Updated benefit ${benefit.code}`);
    } else {
      // Insert new
      await collection.insertOne({
        ...benefit,
        description: null,
        pointWeight: 1.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created benefit ${benefit.code}`);
    }
  }
  
  console.log('Benefits seeding complete!');
}

async function main() {
  try {
    await seedFeatures();
    await seedBenefits();
    console.log('\n✅ All seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();

