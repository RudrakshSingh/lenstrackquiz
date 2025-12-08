// lib/services/lensAdvisorService.js
// Lens Advisor helper functions for RX filtering, matching, and sorting

import { getAllLensProducts, getActiveLensProducts } from '../../models/LensProduct';
import { getLensRxRangesByLens } from '../../models/LensRxRange';
import { getProductBenefitsByProduct } from '../../models/ProductBenefit';
import { getBenefitById } from '../../models/Benefit';

/**
 * Find lenses eligible for a given prescription and frame type
 * @param {Object} prescription - { rSph, rCyl, lSph, lCyl, add? }
 * @param {String} frameType - Frame type (optional)
 * @param {String} visionType - SINGLE_VISION, PROGRESSIVE, etc. (optional)
 * @returns {Promise<Array>} Array of eligible lenses with dynamicFinalPrice
 */
export async function findEligibleLensesByRx(prescription, frameType = null, visionType = null) {
  try {
    // Get all active lenses
    const filter = { isActive: true };
    if (visionType) {
      filter.visionType = visionType;
    }
    
    const lenses = await getActiveLensProducts(filter);
    const eligibleLenses = [];

    for (const lens of lenses) {
      // Get RX ranges for this lens
      const rxRanges = await getLensRxRangesByLens(lens._id);
      
      // Check if prescription fits any RX range
      let matchingRange = null;
      for (const range of rxRanges) {
        const rSph = prescription.rSph || 0;
        const rCyl = prescription.rCyl || 0;
        const lSph = prescription.lSph || 0;
        const lCyl = prescription.lCyl || 0;
        
        // Check if both eyes fit in the range
        const rFits = rSph >= range.sphMin && rSph <= range.sphMax && 
                      Math.abs(rCyl) >= Math.abs(range.cylMin) && Math.abs(rCyl) <= Math.abs(range.cylMax);
        const lFits = lSph >= range.sphMin && lSph <= range.sphMax && 
                      Math.abs(lCyl) >= Math.abs(range.cylMin) && Math.abs(lCyl) <= Math.abs(range.cylMax);
        
        if (rFits && lFits) {
          matchingRange = range;
          break;
        }
      }

      if (matchingRange || rxRanges.length === 0) {
        // Calculate dynamic final price
        const basePrice = lens.baseOfferPrice || lens.offerPrice || 0;
        const addOnPrice = matchingRange ? (matchingRange.addOnPrice || 0) : (lens.addOnPrice || 0);
        const dynamicFinalPrice = basePrice + addOnPrice;

        eligibleLenses.push({
          ...lens,
          id: lens._id.toString(),
          matchingRxRange: matchingRange,
          dynamicFinalPrice,
          baseOfferPrice: basePrice,
          rxAddOnPrice: addOnPrice
        });
      }
    }

    return eligibleLenses;
  } catch (error) {
    console.error('Error in findEligibleLensesByRx:', error);
    throw error;
  }
}

/**
 * Compute match score for a lens based on customer benefit profile
 * @param {Object} lensProduct - Lens product object
 * @param {Object} benefitProfile - { B01: 2.5, B02: 1.0, ... } (0-3 scale)
 * @returns {Promise<Number>} Match score
 */
export async function computeLensMatchScore(lensProduct, benefitProfile) {
  try {
    // Get product benefits
    const productBenefits = await getProductBenefitsByProduct(lensProduct._id || lensProduct.id);
    
    // Build product benefit map
    const productBenefitMap = {};
    for (const pb of productBenefits) {
      const benefit = await getBenefitById(pb.benefitId);
      if (benefit && benefit.code) {
        productBenefitMap[benefit.code] = pb.score || 0;
      }
    }

    // Calculate match score: Σ (benefitProfile[B] * productBenefit[B].score)
    let matchScore = 0;
    for (const [benefitCode, customerPoints] of Object.entries(benefitProfile)) {
      const productScore = productBenefitMap[benefitCode] || 0;
      matchScore += customerPoints * productScore;
    }

    return matchScore;
  } catch (error) {
    console.error('Error in computeLensMatchScore:', error);
    return 0;
  }
}

/**
 * Sort lenses for display
 * @param {Array} lensesWithScores - Array of { lens, matchScore, dynamicFinalPrice, ... }
 * @param {Object} options - { sortBy: 'match'|'price'|'index', order: 'asc'|'desc' }
 * @returns {Array} Sorted lenses
 */
export function sortLensesForDisplay(lensesWithScores, options = {}) {
  const { sortBy = 'match', order = 'desc' } = options;
  
  const sorted = [...lensesWithScores];
  
  // Index value mapping for sorting (thinnest first)
  const indexOrder = {
    'INDEX_174': 1,
    'INDEX_167': 2,
    'INDEX_160': 3,
    'INDEX_156': 4
  };

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'match':
        comparison = (b.matchScore || 0) - (a.matchScore || 0);
        break;
      case 'price':
        comparison = (a.dynamicFinalPrice || 0) - (b.dynamicFinalPrice || 0);
        break;
      case 'index':
        const aIndex = indexOrder[a.lens?.lensIndex || a.lensIndex] || 999;
        const bIndex = indexOrder[b.lens?.lensIndex || b.lensIndex] || 999;
        comparison = aIndex - bIndex; // Thinnest first
        break;
      default:
        // Default: match score desc, then price asc, then index (thinnest first)
        comparison = (b.matchScore || 0) - (a.matchScore || 0);
        if (comparison === 0) {
          comparison = (a.dynamicFinalPrice || 0) - (b.dynamicFinalPrice || 0);
        }
        if (comparison === 0) {
          const aIndex = indexOrder[a.lens?.lensIndex || a.lensIndex] || 999;
          const bIndex = indexOrder[b.lens?.lensIndex || b.lensIndex] || 999;
          comparison = aIndex - bIndex;
        }
    }

    return order === 'asc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Get top N recommended lenses with match scores
 * @param {Object} prescription - Prescription object
 * @param {Object} benefitProfile - Customer benefit profile
 * @param {Object} options - { topN: 3, sortBy: 'match'|'price'|'index', frameType, visionType }
 * @returns {Promise<Array>} Top N recommended lenses
 */
export async function getTopRecommendedLenses(prescription, benefitProfile, options = {}) {
  const { topN = 3, sortBy = 'match', frameType = null, visionType = null } = options;

  try {
    // Find eligible lenses
    const eligibleLenses = await findEligibleLensesByRx(prescription, frameType, visionType);

    // Calculate match scores
    const lensesWithScores = await Promise.all(
      eligibleLenses.map(async (lens) => {
        const matchScore = await computeLensMatchScore(lens, benefitProfile);
        return {
          lens,
          matchScore,
          dynamicFinalPrice: lens.dynamicFinalPrice,
          baseOfferPrice: lens.baseOfferPrice,
          rxAddOnPrice: lens.rxAddOnPrice
        };
      })
    );

    // Sort lenses
    const sorted = sortLensesForDisplay(lensesWithScores, { sortBy, order: 'desc' });

    // Return top N
    return sorted.slice(0, topN);
  } catch (error) {
    console.error('Error in getTopRecommendedLenses:', error);
    throw error;
  }
}

