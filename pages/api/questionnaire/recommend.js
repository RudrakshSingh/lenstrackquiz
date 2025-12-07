// pages/api/questionnaire/recommend.js
// Recommendation API endpoint

import { RecommendationService } from '../../../lib/recommendationService';
import { handleError } from '../../../lib/errors';

// POST /api/questionnaire/recommend
async function recommendHandler(req, res) {
  try {
    const { prescription, frame, answers, visionTypeOverride, budgetFilter } = req.body;

    // Validation
    if (!prescription || !answers) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'prescription and answers are required' }
      });
    }

    // Validate prescription
    if (prescription.rSph === undefined || prescription.lSph === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'prescription must have rSph and lSph' }
      });
    }

    // Validate answers
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'answers must be an array' }
      });
    }

    // Create recommendation service
    const recommendationService = new RecommendationService();

    // Get recommendations
    const result = await recommendationService.recommend({
      prescription,
      frame,
      answers,
      visionTypeOverride,
      budgetFilter
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'POST') {
    return recommendHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

