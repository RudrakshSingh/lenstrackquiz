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

    // Validate benefits format
    if (!Array.isArray(benefits)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'benefits must be an array' }
      });
    }

    // Sync benefits
    await syncAnswerBenefits(answerId, benefits);

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

