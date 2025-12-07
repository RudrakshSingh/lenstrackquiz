// pages/api/admin/products/lenses/index.js
// Lens Product CRUD endpoints

import { withAuth } from '../../../../../middleware/auth';
import { createLensProduct, getAllLensProducts, getLensProductByItCode } from '../../../../../models/LensProduct';
import { handleError, ValidationError, ConflictError } from '../../../../../lib/errors';

// POST /api/admin/products/lenses
async function createLensProductHandler(req, res) {
  try {
    const { itCode, name, brandLine, visionType, lensIndex, tintOption, mrp, offerPrice, addOnPrice, sphMin, sphMax, cylMax, addMin, addMax, deliveryDays, warranty, yopoEligible } = req.body;

    // Validation
    if (!itCode || !name || !brandLine || !visionType || !lensIndex) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
      });
    }

    if (mrp < offerPrice) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'MRP must be >= offerPrice' }
      });
    }

    if (sphMin >= sphMax) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'sphMin must be < sphMax' }
      });
    }

    // Check if itCode already exists
    const existing = await getLensProductByItCode(itCode);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'IT Code already exists' }
      });
    }

    const product = await createLensProduct({
      itCode,
      name,
      brandLine,
      visionType,
      lensIndex,
      tintOption: tintOption || 'CLEAR',
      mrp,
      offerPrice,
      addOnPrice,
      sphMin,
      sphMax,
      cylMax,
      addMin,
      addMax,
      deliveryDays: deliveryDays || 4,
      warranty,
      yopoEligible: yopoEligible !== undefined ? yopoEligible : true,
      isActive: true
    });

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

// GET /api/admin/products/lenses
async function listLensProductsHandler(req, res) {
  try {
    const { visionType, brandLine, isActive } = req.query;
    const filter = {};
    if (visionType) filter.visionType = visionType;
    if (brandLine) filter.brandLine = brandLine;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const products = await getAllLensProducts(filter);
    
    return res.status(200).json({
      success: true,
      data: {
        products: products.map(p => ({
          id: p._id.toString(),
          itCode: p.itCode,
          name: p.name,
          brandLine: p.brandLine,
          visionType: p.visionType,
          lensIndex: p.lensIndex,
          mrp: p.mrp,
          offerPrice: p.offerPrice,
          isActive: p.isActive
        }))
      }
    });
  } catch (error) {
    console.error('Error in listLensProductsHandler:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Check for MongoDB connection errors
    if (error.message && (error.message.includes('MongoDB') || error.message.includes('connection') || error.message.includes('MONGODB_URI') || error.message.includes('queryTxt'))) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection error. Please check MongoDB configuration.'
        }
      });
    }
    
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

