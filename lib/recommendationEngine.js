// lib/recommendationEngine.js
// Product recommendation engine

import { getSessionAnswersBySession } from '../models/SessionAnswer';
import { getAnswerOptionById } from '../models/AnswerOption';
import { getFeatureMappingsByQuestion } from '../models/FeatureMapping';
import { getAllProducts } from '../models/Product';
import { getProductFeaturesByProduct } from '../models/ProductFeature';
import { getStoreProduct } from '../models/StoreProduct';

/**
 * Calculate match score between product and customer preferences
 */
export async function calculateMatchScore(product, preferences, storeId) {
  let score = 0;
  let maxPossibleScore = 0;

  // Get product features
  const productFeatures = await getProductFeaturesByProduct(product._id);
  const productFeatureMap = {};
  productFeatures.forEach(pf => {
    productFeatureMap[pf.featureId.toString()] = pf.strength;
  });

  // Calculate score based on preferences
  for (const [featureId, prefWeight] of Object.entries(preferences)) {
    const productStrength = productFeatureMap[featureId] || 0;
    
    // Positive preference + product has feature = add to score
    if (prefWeight > 0 && productStrength > 0) {
      score += prefWeight * productStrength;
    }
    
    // Negative preference + product has feature = subtract from score
    if (prefWeight < 0 && productStrength > 0) {
      score += prefWeight * productStrength; // Already negative
    }

    maxPossibleScore += Math.abs(prefWeight) * 2.0; // Max strength is 2.0
  }

  // Normalize to 0-100
  const normalizedScore = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, normalizedScore));
}

/**
 * Build preference vector from session answers
 */
export async function buildPreferenceVector(sessionId) {
  const preferences = {};
  
  // Get all answers for this session
  const answers = await getSessionAnswersBySession(sessionId);
  
  // For each answer, get the option and feature mappings
  for (const answer of answers) {
    const option = await getAnswerOptionById(answer.optionId);
    if (!option) continue;

    // Get feature mappings for this question and option
    const mappings = await getFeatureMappingsByQuestion(answer.questionId);
    const relevantMappings = mappings.filter(m => m.optionKey === option.key);

    // Add weights to preferences
    for (const mapping of relevantMappings) {
      const featureId = mapping.featureId.toString();
      if (!preferences[featureId]) {
        preferences[featureId] = 0;
      }
      preferences[featureId] += mapping.weight;
    }
  }

  return preferences;
}

/**
 * Apply diversity bonus to recommendations
 */
function applyDiversityBonus(recommendations) {
  const brandCounts = {};
  const brandGroups = {};

  // Group by brand
  recommendations.forEach((rec, index) => {
    const brand = rec.product.brand || 'Unknown';
    if (!brandCounts[brand]) {
      brandCounts[brand] = 0;
      brandGroups[brand] = [];
    }
    brandCounts[brand]++;
    brandGroups[brand].push(index);
  });

  // Apply bonus to underrepresented brands
  const maxCount = Math.max(...Object.values(brandCounts));
  recommendations.forEach((rec, index) => {
    const brand = rec.product.brand || 'Unknown';
    const count = brandCounts[brand];
    if (count < maxCount) {
      // Small bonus for diversity
      rec.matchScore += (maxCount - count) * 2;
    }
  });

  // Re-sort by score
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations;
}

/**
 * Get product recommendations for a session
 */
export async function getRecommendations(sessionId, storeId, category, limit = 10) {
  // Build preference vector
  const preferences = await buildPreferenceVector(sessionId);

  // Get all active products in this category
  const { getSessionById } = await import('../models/Session');
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Get organization from store
  const { getStoreById } = await import('../models/Store');
  const store = await getStoreById(session.storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  const products = await getAllProducts({
    category: category || session.category,
    isActive: true,
    organizationId: store.organizationId
  });

  // Calculate match scores
  const recommendations = [];
  for (const product of products) {
    // Check store availability
    const storeProduct = await getStoreProduct(storeId, product._id);
    if (storeProduct && !storeProduct.isAvailable) {
      continue; // Skip unavailable products
    }

    const matchScore = await calculateMatchScore(product, preferences, storeId);
    
    recommendations.push({
      product,
      matchScore,
      storePrice: storeProduct?.priceOverride || product.basePrice,
      inStock: storeProduct ? storeProduct.stockQuantity > 0 : false,
      stockQuantity: storeProduct?.stockQuantity || 0
    });
  }

  // Sort by match score
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  // Apply diversity bonus
  const diversified = applyDiversityBonus(recommendations);

  // Return top N
  return diversified.slice(0, limit).map((rec, index) => ({
    ...rec,
    rank: index + 1
  }));
}

