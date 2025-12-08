// pages/api/admin/questionnaire/answers/[answerId]/benefits.js
// Update Answer → Benefit Mapping

import { withAuth } from '../../../../../../middleware/auth';
import { getAnswerNewById } from '../../../../../../models/AnswerNew';
import { syncAnswerBenefits } from '../../../../../../models/AnswerBenefit';
import { handleError } from '../../../../../../lib/errors';

// PUT /api/admin/questionnaire/answers/:answerId/benefits
async function updateAnswerBenefitsHandler(req, res) {
  try {
    const { answerId } = req.query;
    const { benefits } = req.body;

    // Validate answer exists
    const answer = await getAnswerNewById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Answer not found' }
      });
    }

    // Validate benefits format - support both array and object format
    let benefitsArray = [];
    
    if (Array.isArray(benefits)) {
      benefitsArray = benefits;
    } else if (benefits && typeof benefits === 'object') {
      // Convert benefitMapping object to array format
      for (const [benefitCode, points] of Object.entries(benefits)) {
        const pointsValue = parseFloat(points) || 0;
        const clampedPoints = Math.max(0, Math.min(3, pointsValue));
        if (clampedPoints > 0) {
          benefitsArray.push({
            benefitCode,
            points: clampedPoints
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'benefits must be an array or object (benefitMapping)' }
      });
    }

    // Validate benefit points
    for (const benefit of benefitsArray) {
      if (!benefit.benefitCode || !/^B\d{2}$/.test(benefit.benefitCode)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid benefit code: ${benefit.benefitCode}` }
        });
      }
      const points = parseFloat(benefit.points);
      if (isNaN(points) || points < 0 || points > 3) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Benefit points for ${benefit.benefitCode} must be between 0 and 3` }
        });
      }
    }

    // Sync benefits
    await syncAnswerBenefits(answerId, benefitsArray);

    return res.status(200).json({
      success: true,
      message: 'Answer benefits updated successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'PUT') {
    return withAuth(updateAnswerBenefitsHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

