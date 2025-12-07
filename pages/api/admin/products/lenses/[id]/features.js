// pages/api/admin/products/lenses/[id]/features.js
// Set Product Features

import { withAuth } from '../../../../../../middleware/auth';
import { getLensProductById } from '../../../../../../models/LensProduct';
import { getFeatureByCode } from '../../../../../../models/Feature';
import { syncProductFeatures } from '../../../../../../models/ProductFeature';
import { handleError } from '../../../../../../lib/errors';

// PUT /api/admin/products/lenses/:id/features
async function setProductFeaturesHandler(req, res) {
  try {
    const { id } = req.query;
    const { featureCodes } = req.body;

    // Validate product exists
    const product = await getLensProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    // Validate featureCodes format
    if (!Array.isArray(featureCodes)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'featureCodes must be an array' }
      });
    }

    // Get feature IDs from codes
    const featureIds = [];
    for (const code of featureCodes) {
      const feature = await getFeatureByCode(code);
      if (feature) {
        featureIds.push(feature._id);
      }
    }

    // Sync features
    await syncProductFeatures(id, featureIds);

    return res.status(200).json({
      success: true,
      message: 'Features updated successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'PUT') {
    return withAuth(setProductFeaturesHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

