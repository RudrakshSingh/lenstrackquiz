// pages/api/admin/products/lenses/index.js
// Lens Product CRUD endpoints (V2 Architecture)

import { withAuth } from '../../../../../middleware/auth';
import { createLensProduct, getAllLensProducts, getLensProductByItCode } from '../../../../../models/LensProduct';
import { syncLensRxRanges } from '../../../../../models/LensRxRange';
import { syncProductFeatures } from '../../../../../models/ProductFeature';
import { syncProductBenefits } from '../../../../../models/ProductBenefit';
import { syncProductSpecifications } from '../../../../../models/ProductSpecification';
import { handleError, ValidationError, ConflictError } from '../../../../../lib/errors';

// POST /api/admin/products/lenses
// V2 Spec Contract: itCode, name, brandLine, visionType, lensIndex, tintOption, baseOfferPrice, addOnPrice, category, yopoEligible, rxRanges[], featureCodes[], benefitScores{}
async function createLensProductHandler(req, res) {
  try {
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
      isActive
    } = req.body;

    // Validation - V2 required fields
    if (!itCode || !name || !brandLine || !visionType || !lensIndex || baseOfferPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: itCode, name, brandLine, visionType, lensIndex, baseOfferPrice' }
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

    // Check if itCode already exists
    const existing = await getLensProductByItCode(itCode);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'IT Code already exists' }
      });
    }

    // Create lens product
    const product = await createLensProduct({
      itCode,
      name,
      brandLine,
      visionType,
      lensIndex,
      tintOption,
      baseOfferPrice,
      addOnPrice: addOnPrice || 0,
      category,
      yopoEligible: yopoEligible !== undefined ? yopoEligible : true,
      deliveryDays: deliveryDays || 4,
      isActive: isActive !== undefined ? isActive : true
    });

    const productId = product._id;

    // Sync RX Ranges
    if (rxRanges && Array.isArray(rxRanges) && rxRanges.length > 0) {
      await syncLensRxRanges(productId, rxRanges);
    }

    // Sync Features (F01-F11)
    if (featureCodes && Array.isArray(featureCodes) && featureCodes.length > 0) {
      await syncProductFeatures(productId, featureCodes);
    }

    // Sync Benefits (B01-B12)
    if (benefitScores && typeof benefitScores === 'object') {
      await syncProductBenefits(productId, benefitScores);
    }

    // Sync Specifications if provided
    if (specifications && Array.isArray(specifications)) {
      await syncProductSpecifications(productId, specifications);
    }

    return res.status(201).json({
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

// GET /api/admin/products/lenses?search=&visionType=&index=&brandLine=
// V2 Spec: Returns itCode, name, brandLine, lensIndex, baseOfferPrice, category, yopoEligible, isActive
async function listLensProductsHandler(req, res) {
  try {
    const { search, visionType, index, brandLine, isActive } = req.query;
    const filter = {};
    
    // V2 Spec filters
    if (visionType) filter.visionType = visionType;
    if (index) filter.lensIndex = index;
    if (brandLine) filter.brandLine = brandLine;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    let products = await getAllLensProducts(filter);
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        (p.itCode && p.itCode.toLowerCase().includes(searchLower)) ||
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.brandLine && p.brandLine.toLowerCase().includes(searchLower))
      );
    }
    
    return res.status(200).json({
      success: true,
      data: {
        products: products.map(p => ({
          id: p._id.toString(),
          itCode: p.itCode,
          name: p.name,
          brandLine: p.brandLine,
          lensIndex: p.lensIndex || p.index,
          baseOfferPrice: p.baseOfferPrice || p.offerPrice || 0,
          category: p.category,
          yopoEligible: p.yopoEligible !== false,
          isActive: p.isActive !== false
        }))
      }
    });
  } catch (error) {
    console.error('Error in listLensProductsHandler:', error);
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return listLensProductsHandler(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createLensProductHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

