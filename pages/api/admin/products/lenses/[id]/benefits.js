// pages/api/admin/products/lenses/[id]/benefits.js
// Set Product Benefit Scores

import { withAuth } from '../../../../../../middleware/auth';
import { getLensProductById } from '../../../../../../models/LensProduct';
import { syncProductBenefits } from '../../../../../../models/ProductBenefit';
import { handleError } from '../../../../../../lib/errors';

// PUT /api/admin/products/lenses/:id/benefits
async function setProductBenefitsHandler(req, res) {
  try {
    const { id } = req.query;
    const { benefits } = req.body;

    // Validate product exists
    const product = await getLensProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
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
    await syncProductBenefits(id, benefits);

    return res.status(200).json({
      success: true,
      message: 'Benefits updated successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'PUT') {
    return withAuth(setProductBenefitsHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

