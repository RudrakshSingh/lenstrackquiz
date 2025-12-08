// pages/api/admin/products/lenses/[id].js
// Get, Update, Delete Lens Product

import { withAuth } from '../../../../../middleware/auth';
import { getLensProductById, updateLensProduct, deleteLensProduct } from '../../../../../models/LensProduct';
import { getLensRxRangesByLens } from '../../../../../models/LensRxRange';
import { getProductFeaturesByProduct } from '../../../../../models/ProductFeature';
import { getProductBenefitsByProduct } from '../../../../../models/ProductBenefit';
import { getProductSpecificationsByProduct } from '../../../../../models/ProductSpecification';
import { getFeatureById } from '../../../../../models/Feature';
import { getBenefitById } from '../../../../../models/Benefit';
import { syncLensRxRanges } from '../../../../../models/LensRxRange';
import { syncProductFeatures } from '../../../../../models/ProductFeature';
import { syncProductBenefits } from '../../../../../models/ProductBenefit';
import { syncProductSpecifications } from '../../../../../models/ProductSpecification';
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

    // Get related data - V2 Spec format
    const [rxRanges, features, benefits, specs] = await Promise.all([
      getLensRxRangesByLens(product._id),
      getProductFeaturesByProduct(product._id),
      getProductBenefitsByProduct(product._id),
      getProductSpecificationsByProduct(product._id)
    ]);

    // Populate feature codes (F01-F11)
    const featureCodes = [];
    for (const pf of features) {
      const feature = await getFeatureById(pf.featureId);
      if (feature && feature.code) {
        featureCodes.push(feature.code);
      }
    }

    // Populate benefit scores (B01-B12) as object
    const benefitScores = {};
    for (const pb of benefits) {
      const benefit = await getBenefitById(pb.benefitId);
      if (benefit && benefit.code) {
        benefitScores[benefit.code] = pb.score || 0;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: product._id.toString(),
        itCode: product.itCode,
        name: product.name,
        brandLine: product.brandLine,
        visionType: product.visionType || product.type,
        lensIndex: product.lensIndex || product.index,
        tintOption: product.tintOption,
        category: product.category,
        baseOfferPrice: product.baseOfferPrice || product.offerPrice || 0,
        addOnPrice: product.addOnPrice || 0,
        deliveryDays: product.deliveryDays || 4,
        yopoEligible: product.yopoEligible !== false,
        isActive: product.isActive !== false,
        // V2 Spec arrays/objects
        rxRanges: rxRanges.map(r => ({
          id: r._id.toString(),
          sphMin: r.sphMin,
          sphMax: r.sphMax,
          cylMin: r.cylMin || 0,
          cylMax: r.cylMax,
          addOnPrice: r.addOnPrice || 0
        })),
        featureCodes: featureCodes.sort(),
        benefitScores: benefitScores,
        // Specifications (optional)
        specifications: specs.map(s => ({
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
// V2 Spec Contract: Same as POST - can update all fields including rxRanges, featureCodes, benefitScores
async function updateLensProductHandler(req, res) {
  try {
    const { id } = req.query;
    const { 
      itCode, 
      name,
      brandLine,
      visionType,
      lensIndex,
      tintOption,
      baseOfferPrice,
      addOnPrice,
      category,
      yopoEligible,
      deliveryDays,
      rxRanges,
      featureCodes,
      benefitScores,
      specifications,
      isActive,
      ...otherFields
    } = req.body;

    // Check if product exists
    const existing = await getLensProductById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lens product not found' }
      });
    }

    // Validate rxRanges if provided
    if (rxRanges && Array.isArray(rxRanges)) {
      for (const range of rxRanges) {
        if (range.sphMin >= range.sphMax) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'rxRange.sphMin must be < rxRange.sphMax' }
          });
        }
        if (range.cylMin > range.cylMax) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'rxRange.cylMin must be <= rxRange.cylMax' }
          });
        }
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (brandLine !== undefined) updateData.brandLine = brandLine;
    if (visionType !== undefined) updateData.visionType = visionType;
    if (lensIndex !== undefined) updateData.lensIndex = lensIndex;
    if (tintOption !== undefined) updateData.tintOption = tintOption;
    if (category !== undefined) updateData.category = category;
    if (baseOfferPrice !== undefined) updateData.baseOfferPrice = typeof baseOfferPrice === 'number' ? baseOfferPrice : parseFloat(baseOfferPrice);
    if (addOnPrice !== undefined) updateData.addOnPrice = typeof addOnPrice === 'number' ? addOnPrice : parseFloat(addOnPrice || 0);
    if (deliveryDays !== undefined) updateData.deliveryDays = deliveryDays;
    if (yopoEligible !== undefined) updateData.yopoEligible = yopoEligible;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update lens product
    const product = await updateLensProduct(id, updateData);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    // Sync RX Ranges if provided
    if (rxRanges !== undefined) {
      await syncLensRxRanges(id, rxRanges || []);
    }

    // Sync Features if provided
    if (featureCodes !== undefined) {
      await syncProductFeatures(id, featureCodes || []);
    }

    // Sync Benefits if provided
    if (benefitScores !== undefined) {
      await syncProductBenefits(id, benefitScores || {});
    }

    // Sync Specifications if provided
    if (specifications !== undefined) {
      await syncProductSpecifications(id, specifications || []);
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

