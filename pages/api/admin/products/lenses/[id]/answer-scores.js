// pages/api/admin/products/lenses/[id]/answer-scores.js
// Set Answer → Product Boosts

import { withAuth } from '../../../../../../middleware/auth';
import { getLensProductById } from '../../../../../../models/LensProduct';
import { syncProductAnswerScores } from '../../../../../../models/ProductAnswerScore';
import { handleError } from '../../../../../../lib/errors';

// PUT /api/admin/products/lenses/:id/answer-scores
async function setProductAnswerScoresHandler(req, res) {
  try {
    const { id } = req.query;
    const { mappings } = req.body;

    // Validate product exists
    const product = await getLensProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    // Validate mappings format
    if (!Array.isArray(mappings)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'mappings must be an array' }
      });
    }

    // Sync answer scores
    await syncProductAnswerScores(id, mappings);

    return res.status(200).json({
      success: true,
      message: 'Answer scores updated successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'PUT') {
    return withAuth(setProductAnswerScoresHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

