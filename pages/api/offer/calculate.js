// pages/api/offer/calculate.js
// Offer Engine API endpoint (V1.0 Spec)

import { OfferEngineV2 } from '../../../lib/offerEngine/OfferEngineV2';
import { handleError } from '../../../lib/errors';

// POST /api/offer/calculate
async function calculateOfferHandler(req, res) {
  try {
    const { 
      frame, 
      lens, 
      storeId, 
      salesMode, 
      customerCategory, 
      couponCode, 
      selectedBonusProduct 
    } = req.body;

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
    const offerEngine = new OfferEngineV2();

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
      selectedBonusProduct: selectedBonusProduct || null,
      storeId: storeId || null,
      salesMode: salesMode || 'SELF_SERVICE'
    });

    // Format response to match V1.0 Spec exactly
    const yopoApplied = result.offersApplied?.some(o => o.offerType === 'YOPO' || o.offerType === 'YOPO_LOGIC') || false;
    const comboApplied = result.offersApplied?.some(o => o.offerType === 'COMBO_PRICE') || false;
    
    const response = {
      success: true,
      baseFramePrice: result.frameMRP,
      baseLensPrice: result.lensPrice,
      appliedOffers: result.offersApplied || [],
      yopoApplied: yopoApplied,
      comboApplied: comboApplied,
      bonusProduct: result.bonusProduct || null,
      freeItem: result.freeItem || null, // V1.0 Spec: Tagged free item from YOPO
      upsellMessages: result.upsell ? [result.upsell.message] : [],
      finalPrice: result.finalPayable,
      breakdown: result.priceComponents || []
    };

    return res.status(200).json(response);
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

