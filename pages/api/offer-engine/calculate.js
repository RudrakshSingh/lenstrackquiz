// pages/api/offer-engine/calculate.js
// Enhanced Offer Engine API endpoint (V2)

import { OfferEngineV2 } from '../../../lib/offerEngine/OfferEngineV2';
import { handleError } from '../../../lib/errors';

// POST /api/offer-engine/calculate
async function calculateOfferHandler(req, res) {
  try {
    const { frame, lens, customerCategory, couponCode, secondPair, cart } = req.body;

    // Support both direct frame/lens and cart DTO format
    let frameInput, lensInput;
    let finalCustomerCategory, finalCouponCode, finalSecondPair;
    
    if (cart) {
      // Cart DTO format
      frameInput = cart.frame;
      lensInput = cart.lens;
      finalCustomerCategory = cart.customerCategory || customerCategory || null;
      finalCouponCode = cart.couponCode || couponCode || null;
      finalSecondPair = cart.secondPair || secondPair || null;
    } else {
      // Direct format (backward compatible)
      frameInput = frame;
      lensInput = lens;
      finalCustomerCategory = customerCategory || null;
      finalCouponCode = couponCode || null;
      finalSecondPair = secondPair || null;
    }

    // Validation
    if (!frameInput || !lensInput) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'frame and lens are required' }
      });
    }

    if (!frameInput.brand || frameInput.mrp === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'frame.brand and frame.mrp are required' }
      });
    }

    if (!lensInput.itCode || lensInput.price === undefined || !lensInput.brandLine) {
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
        brand: frameInput.brand,
        subCategory: frameInput.subCategory || null,
        mrp: typeof frameInput.mrp === 'number' ? frameInput.mrp : parseFloat(frameInput.mrp),
        frameType: frameInput.frameType || null
      },
      lens: {
        itCode: lensInput.itCode,
        price: typeof lensInput.price === 'number' ? lensInput.price : parseFloat(lensInput.price),
        brandLine: lensInput.brandLine,
        yopoEligible: lensInput.yopoEligible !== undefined ? lensInput.yopoEligible : true
      },
      customerCategory: finalCustomerCategory,
      couponCode: finalCouponCode,
      secondPair: finalSecondPair
    });

    // Format response to match Master Spec V3.0
    const response = {
      success: true,
      data: {
        // Master Spec format
        appliedOffers: result.offersApplied || [],
        finalPrice: result.finalPayable,
        breakdown: result.priceComponents || [],
        upsell: result.upsell || null,
        // Additional fields for backward compatibility
        frameMRP: result.frameMRP,
        lensPrice: result.lensPrice,
        baseTotal: result.baseTotal,
        effectiveBase: result.effectiveBase,
        offersApplied: result.offersApplied,
        priceComponents: result.priceComponents,
        categoryDiscount: result.categoryDiscount,
        couponDiscount: result.couponDiscount,
        secondPairDiscount: result.secondPairDiscount,
        finalPayable: result.finalPayable
      }
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

