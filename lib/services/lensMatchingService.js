// lib/services/lensMatchingService.js
// Lens matching and recommendation service

import { calculateMatchScore, getProductBenefitMap } from './benefitService';
import { getDatabase } from '../../lib/mongodb';

/**
 * Filter lenses by RX and index requirements
 * @param {Array} lenses - Array of lens products
 * @param {Object} prescription - Prescription data { right: {sph, cyl}, left: {sph, cyl}, add }
 * @param {string} frameType - Frame type (full_rim_plastic, half_rim, etc.)
 * @returns {Array} Filtered lenses
 */
export function filterLensesByRxAndIndex(lenses, prescription, frameType) {
  if (!lenses || lenses.length === 0) {
    return [];
  }

  const filtered = lenses.filter(lens => {
    // Check if lens is active
    if (lens.is_active === false || lens.isActive === false) {
      return false;
    }

    // Check frame compatibility
    if (frameType && lens.frame_compatibility && lens.frame_compatibility.length > 0) {
      if (!lens.frame_compatibility.includes(frameType)) {
        return false;
      }
    }

    // Check power range
    if (prescription) {
      const maxPower = Math.max(
        Math.abs(prescription.right?.sph || 0),
        Math.abs(prescription.left?.sph || 0)
      );

      const minPowerSupported = lens.min_power_supported || lens.minPowerSupported || -10;
      const maxPowerSupported = lens.max_power_supported || lens.maxPowerSupported || 10;

      if (maxPower < minPowerSupported || maxPower > maxPowerSupported) {
        return false;
      }
    }

    // Check index if specified
    if (prescription?.index && lens.index) {
      // Allow lenses with index >= required index
      if (lens.index < prescription.index) {
        return false;
      }
    }

    return true;
  });

  return filtered;
}

/**
 * Sort lenses by match score (descending)
 * @param {Array} lensesWithScores - Array of { lens, matchScore }
 * @returns {Array} Sorted lenses
 */
export function sortLenses(lensesWithScores) {
  return lensesWithScores.sort((a, b) => {
    // Primary sort: match score (descending)
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    // Secondary sort: price (ascending) for same score
    const priceA = a.lens.offerPrice || a.lens.price_mrp || a.lens.price || 0;
    const priceB = b.lens.offerPrice || b.lens.price_mrp || b.lens.price || 0;
    return priceA - priceB;
  });
}

/**
 * Get all active lenses from MongoDB
 * @returns {Promise<Array>} Array of lens products
 */
export async function getAllActiveLenses() {
  try {
    const db = await getDatabase('lensquiz');
    const collection = db.collection('lenses');
    return await collection.find({ 
      $or: [
        { is_active: true },
        { isActive: true },
        { is_active: { $exists: false } },
        { isActive: { $exists: false } }
      ]
    }).toArray();
  } catch (error) {
    console.error('Error fetching lenses:', error);
    return [];
  }
}

/**
 * Calculate match scores for all lenses
 * @param {Array} lenses - Array of lens products
 * @param {Record<string, number>} customerBenefitProfile - Customer benefit profile
 * @returns {Promise<Array>} Array of { lens, matchScore }
 */
export async function calculateLensMatchScores(lenses, customerBenefitProfile) {
  if (!lenses || lenses.length === 0 || !customerBenefitProfile) {
    return [];
  }

  const lensesWithScores = await Promise.all(
    lenses.map(async (lens) => {
      const productId = lens._id?.toString() || lens.id || lens.itCode || lens.sku;
      const productBenefitMap = await getProductBenefitMap(productId);
      const matchScore = calculateMatchScore(customerBenefitProfile, productBenefitMap);

      return {
        lens,
        matchScore,
        productBenefitMap
      };
    })
  );

  return lensesWithScores;
}

/**
 * Get top N recommendations
 * @param {Array} sortedLenses - Sorted array of { lens, matchScore }
 * @param {number} topN - Number of top recommendations
 * @returns {Array} Top N recommendations
 */
export function getTopRecommendations(sortedLenses, topN = 3) {
  return sortedLenses.slice(0, topN);
}

/**
 * Get lowest safe price lens (walkout prevention)
 * @param {Array} filteredLenses - Filtered lenses
 * @returns {Object | null} Lowest price lens
 */
export function getLowestSafePriceLens(filteredLenses) {
  if (!filteredLenses || filteredLenses.length === 0) {
    return null;
  }

  return filteredLenses.reduce((lowest, current) => {
    const currentPrice = current.lens?.offerPrice || current.lens?.price_mrp || current.lens?.price || Infinity;
    const lowestPrice = lowest?.lens?.offerPrice || lowest?.lens?.price_mrp || lowest?.lens?.price || Infinity;
    
    return currentPrice < lowestPrice ? current : lowest;
  }, null);
}

