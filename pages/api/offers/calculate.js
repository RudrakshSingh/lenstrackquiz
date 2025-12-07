// pages/api/offers/calculate.js
// Offer calculation endpoint

import { OfferEngineService } from '../../../lib/offerEngineService';
import { handleError } from '../../../lib/errors';

// POST /api/offers/calculate
async function calculateOfferHandler(req, res) {
  try {
    const { frame, lens, customerCategory, couponCode, secondPair } = req.body;

    // Validation
    if (!frame || !lens) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'frame and lens are required' }
      });
    }

    if (!frame.brand || frame.mrp === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'frame.brand and frame.mrp are required' }
      });
    }

    if (!lens.itCode || lens.price === undefined || !lens.brandLine) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'lens.itCode, lens.price, and lens.brandLine are required' }
      });
    }

    // Create offer engine service
    const offerEngine = new OfferEngineService();

    // Calculate offer
    const result = await offerEngine.calculate({
      frame: {
        brand: frame.brand,
        subCategory: frame.subCategory || null,
        mrp: typeof frame.mrp === 'number' ? frame.mrp : parseFloat(frame.mrp),
        frameType: frame.frameType || null
      },
      lens: {
        itCode: lens.itCode,
        price: typeof lens.price === 'number' ? lens.price : parseFloat(lens.price),
        brandLine: lens.brandLine,
        yopoEligible: lens.yopoEligible !== undefined ? lens.yopoEligible : true
      },
      customerCategory: customerCategory || null,
      couponCode: couponCode || null,
      secondPair: secondPair || null
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Offer calculation error:', error);
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'POST') {
    return calculateOfferHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

