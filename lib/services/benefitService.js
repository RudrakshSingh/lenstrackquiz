// lib/services/benefitService.js
// Benefit calculation and scoring service (MongoDB)

import { 
  getAnswerBenefitsByAnswers,
  getAnswerBenefitsByAnswer 
} from '../../models/AnswerBenefit';
import { getAllBenefits, getBenefitByCode } from '../../models/Benefit';
import { getProductBenefitsByProduct } from '../../models/ProductBenefit';

/**
 * Calculate customer benefit profile from selected answers
 * @param {string[]} answerIds - Array of answer IDs selected by customer
 * @returns {Promise<Record<string, number>>} Benefit profile { B01: 6.5, B02: 2.0, ... }
 */
export async function calculateCustomerBenefits(answerIds) {
  if (!answerIds || answerIds.length === 0) {
    return {};
  }

  // Fetch all answer-benefit mappings for the selected answers
  const answerBenefits = await getAnswerBenefitsByAnswers(answerIds);

  if (!answerBenefits || answerBenefits.length === 0) {
    return {};
  }

  // Get all benefits to map benefitId to code
  const allBenefits = await getAllBenefits();
  const benefitMap = {};
  allBenefits.forEach(b => {
    benefitMap[b._id.toString()] = b.code;
  });

  // Aggregate points by benefit code
  const benefitProfile = {};
  
  answerBenefits.forEach((ab) => {
    const benefitCode = benefitMap[ab.benefitId.toString()];
    if (benefitCode) {
      if (!benefitProfile[benefitCode]) {
        benefitProfile[benefitCode] = 0;
      }
      benefitProfile[benefitCode] += ab.points || 0;
    }
  });

  return benefitProfile;
}

/**
 * Calculate match score between customer benefit profile and product benefits
 * @param {Record<string, number>} customerBenefitMap - Customer benefit profile
 * @param {Record<string, number>} productBenefitMap - Product benefit mapping
 * @returns {number} Match score (0-100, higher is better)
 */
export function calculateMatchScore(customerBenefitMap, productBenefitMap) {
  if (!customerBenefitMap || !productBenefitMap) {
    return 0;
  }

  let totalScore = 0;
  let totalWeight = 0;

  // Calculate weighted match score
  Object.keys(customerBenefitMap).forEach((benefitCode) => {
    const customerPoints = customerBenefitMap[benefitCode] || 0;
    const productPoints = productBenefitMap[benefitCode] || 0;

    if (customerPoints > 0) {
      // Weighted score: customer need * product capability
      const match = customerPoints * productPoints;
      totalScore += match;
      totalWeight += customerPoints;
    }
  });

  // Normalize to percentage (0-100)
  if (totalWeight === 0) {
    return 0;
  }

  const normalizedScore = (totalScore / (totalWeight * 3)) * 100; // Max possible is totalWeight * 3
  return Math.min(100, Math.max(0, normalizedScore));
}

/**
 * Get product benefit mapping
 * @param {string} productId - Product/Lens ID
 * @returns {Promise<Record<string, number>>} Product benefit mapping
 */
export async function getProductBenefitMap(productId) {
  const productBenefits = await getProductBenefitsByProduct(productId);

  if (!productBenefits || productBenefits.length === 0) {
    return {};
  }

  // Get all benefits to map benefitId to code
  const allBenefits = await getAllBenefits();
  const benefitMap = {};
  allBenefits.forEach(b => {
    benefitMap[b._id.toString()] = b.code;
  });

  const benefitProfile = {};
  productBenefits.forEach((pb) => {
    const benefitCode = benefitMap[pb.benefitId.toString()];
    if (benefitCode) {
      // Support both 'points' and 'score' fields for backward compatibility
      benefitProfile[benefitCode] = pb.points || pb.score || 0;
    }
  });

  return benefitProfile;
}

/**
 * Get all benefits list
 * @returns {Promise<Array>} List of all benefits
 */
export async function getAllBenefitsList() {
  return await getAllBenefits();
}

/**
 * Get benefit by code
 * @param {string} code - Benefit code (e.g., "B01")
 * @returns {Promise<Object | null>}
 */
export async function getBenefitByCodeService(code) {
  return await getBenefitByCode(code);
}
