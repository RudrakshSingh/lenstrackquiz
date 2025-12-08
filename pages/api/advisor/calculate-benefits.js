// pages/api/advisor/calculate-benefits.js
// Calculate customer benefit profile from selected answers

import { calculateCustomerBenefits } from '../../../lib/services/benefitService';
import { handleError } from '../../../lib/errors';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const { answers } = req.body;

    // Validation
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'answers must be an array of answer IDs' }
      });
    }

    if (answers.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          benefitProfile: {}
        }
      });
    }

    // Calculate benefit profile
    const benefitProfile = await calculateCustomerBenefits(answers);

    return res.status(200).json({
      success: true,
      data: {
        benefitProfile
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

