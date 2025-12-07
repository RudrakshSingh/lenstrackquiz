// pages/api/admin/products/lenses/[id].js
// Get, Update, Delete Lens Product

import { withAuth } from '../../../../../middleware/auth';
import { getLensProductById, updateLensProduct, deleteLensProduct } from '../../../../../models/LensProduct';
import { getProductFeaturesByProduct } from '../../../../../models/ProductFeature';
import { getProductBenefitsByProduct } from '../../../../../models/ProductBenefit';
import { getProductSpecificationsByProduct } from '../../../../../models/ProductSpecification';
import { getFeatureById } from '../../../../../models/Feature';
import { getBenefitById } from '../../../../../models/Benefit';
import { handleError } from '../../../../../lib/errors';

// GET /api/admin/products/lenses/:id
async function getLensProductHandler(req, res) {
  try {
    const { id } = req.query;
    const product = await getLensProductById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    // Get related data
    const [features, benefits, specs] = await Promise.all([
      getProductFeaturesByProduct(product._id),
      getProductBenefitsByProduct(product._id),
      getProductSpecificationsByProduct(product._id)
    ]);

    // Populate feature details
    const featureDetails = await Promise.all(
      features.map(async (pf) => {
        const feature = await getFeatureById(pf.featureId);
        return feature ? { code: feature.code, name: feature.name } : null;
      })
    );

    // Populate benefit details
    const benefitDetails = await Promise.all(
      benefits.map(async (pb) => {
        const benefit = await getBenefitById(pb.benefitId);
        return benefit ? { code: benefit.code, score: pb.score } : null;
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        id: product._id.toString(),
        itCode: product.itCode,
        name: product.name,
        brandLine: product.brandLine,
        visionType: product.visionType,
        lensIndex: product.lensIndex,
        tintOption: product.tintOption,
        mrp: product.mrp,
        offerPrice: product.offerPrice,
        addOnPrice: product.addOnPrice,
        yopoEligible: product.yopoEligible,
        sphMin: product.sphMin,
        sphMax: product.sphMax,
        cylMax: product.cylMax,
        addMin: product.addMin,
        addMax: product.addMax,
        features: featureDetails.filter(f => f !== null),
        benefits: benefitDetails.filter(b => b !== null),
        specs: specs.map(s => ({
          key: s.key,
          value: s.value,
          group: s.group
        }))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/products/lenses/:id
async function updateLensProductHandler(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    // Validation
    if (updateData.mrp !== undefined && updateData.offerPrice !== undefined && updateData.mrp < updateData.offerPrice) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'MRP must be >= offerPrice' }
      });
    }

    const product = await updateLensProduct(id, updateData);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: product._id.toString(),
        itCode: product.itCode
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/admin/products/lenses/:id
async function deleteLensProductHandler(req, res) {
  try {
    const { id } = req.query;
    const result = await deleteLensProduct(id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return getLensProductHandler(req, res);
  }
  if (req.method === 'PUT') {
    return withAuth(updateLensProductHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  if (req.method === 'DELETE') {
    return withAuth(deleteLensProductHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

