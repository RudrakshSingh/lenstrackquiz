// pages/api/advisor/recommend.js
// Lens recommendation endpoint with benefit matching

import { 
  getAllActiveLenses,
  filterLensesByRxAndIndex,
  calculateLensMatchScores,
  sortLenses,
  getTopRecommendations,
  getLowestSafePriceLens
} from '../../../lib/services/lensMatchingService';
import { handleError } from '../../../lib/errors';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const { benefitProfile, rx, frame } = req.body;

    // Validation
    if (!benefitProfile || typeof benefitProfile !== 'object') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'benefitProfile is required' }
      });
    }

    // Get all active lenses
    const allLenses = await getAllActiveLenses();

    if (allLenses.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          recommendations: [],
          lowestSafePrice: null,
          message: 'No lenses available'
        }
      });
    }

    // Filter lenses by RX and frame type
    const frameType = frame?.type || frame?.frameType || null;
    const filteredLenses = filterLensesByRxAndIndex(allLenses, rx, frameType);

    if (filteredLenses.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          recommendations: [],
          lowestSafePrice: null,
          message: 'No lenses match the prescription and frame requirements'
        }
      });
    }

    // Calculate match scores for all filtered lenses
    const lensesWithScores = await calculateLensMatchScores(filteredLenses, benefitProfile);

    // Sort by match score
    const sortedLenses = sortLenses(lensesWithScores);

    // Get top 3 recommendations
    const topRecommendations = getTopRecommendations(sortedLenses, 3);

    // Get lowest safe price lens (walkout prevention)
    const lowestSafePrice = getLowestSafePriceLens(sortedLenses);

    // Format response
    const recommendations = topRecommendations.map((item, index) => ({
      rank: index + 1,
      lens: {
        id: item.lens._id?.toString() || item.lens.id || item.lens.itCode || item.lens.sku,
        name: item.lens.name,
        itCode: item.lens.itCode || item.lens.sku,
        brandLine: item.lens.brandLine,
        index: item.lens.index,
        price: item.lens.offerPrice || item.lens.price_mrp || item.lens.price || 0,
        features: item.lens.features || [],
        specifications: item.lens.specifications || item.lens.specs || []
      },
      matchScore: Math.round(item.matchScore * 10) / 10, // Round to 1 decimal
      productBenefitMap: item.productBenefitMap
    }));

    const lowestSafePriceLens = lowestSafePrice ? {
      id: lowestSafePrice.lens._id?.toString() || lowestSafePrice.lens.id || lowestSafePrice.lens.itCode || lowestSafePrice.lens.sku,
      name: lowestSafePrice.lens.name,
      itCode: lowestSafePrice.lens.itCode || lowestSafePrice.lens.sku,
      price: lowestSafePrice.lens.offerPrice || lowestSafePrice.lens.price_mrp || lowestSafePrice.lens.price || 0,
      matchScore: Math.round(lowestSafePrice.matchScore * 10) / 10
    } : null;

    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        lowestSafePrice: lowestSafePriceLens,
        totalEligible: filteredLenses.length
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

