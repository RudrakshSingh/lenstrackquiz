// pages/api/admin/products/lenses/[id]/specs.js
// Set Product Specifications

import { withAuth } from '../../../../../../middleware/auth';
import { getLensProductById } from '../../../../../../models/LensProduct';
import { syncProductSpecifications } from '../../../../../../models/ProductSpecification';
import { handleError } from '../../../../../../lib/errors';

// PUT /api/admin/products/lenses/:id/specs
async function setProductSpecsHandler(req, res) {
  try {
    const { id } = req.query;
    const { specs } = req.body;

    // Validate product exists
    const product = await getLensProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    // Validate specs format
    if (!Array.isArray(specs)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'specs must be an array' }
      });
    }

    // Sync specifications
    await syncProductSpecifications(id, specs);

    return res.status(200).json({
      success: true,
      message: 'Specifications updated successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'PUT') {
    return withAuth(setProductSpecsHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

