// pages/api/admin/offers/index.js
// Offer Rules CRUD endpoints

import { withAuth } from '../../../../middleware/auth';
import { createOfferRule, getAllOfferRules, getOfferRuleByCode } from '../../../../models/OfferRule';
import { handleError } from '../../../../lib/errors';

// POST /api/admin/offers
async function createOfferRuleHandler(req, res) {
  try {
    const { name, code, offerType, frameBrand, frameSubCategory, minFrameMRP, maxFrameMRP, lensBrandLines, lensItCodes, discountType, discountValue, comboPrice, freeProductId, isSecondPairRule, secondPairPercent, priority, isActive, startDate, endDate } = req.body;

    // Validation
    if (!name || !code || !offerType || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
      });
    }

    // Check if code already exists
    const existing = await getOfferRuleByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Offer code already exists' }
      });
    }

    const offer = await createOfferRule({
      name,
      code,
      offerType,
      frameBrand,
      frameSubCategory,
      minFrameMRP,
      maxFrameMRP,
      lensBrandLines: lensBrandLines || [],
      lensItCodes: lensItCodes || [],
      discountType,
      discountValue,
      comboPrice,
      freeProductId,
      isSecondPairRule: isSecondPairRule !== undefined ? isSecondPairRule : false,
      secondPairPercent,
      priority: priority || 100,
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate
    });

    return res.status(201).json({
      success: true,
      data: {
        id: offer._id.toString(),
        code: offer.code
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// GET /api/admin/offers
async function listOfferRulesHandler(req, res) {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const offers = await getAllOfferRules(filter);
    
    return res.status(200).json({
      success: true,
      data: {
        offers: offers.map(o => ({
          id: o._id.toString(),
          name: o.name,
          code: o.code,
          offerType: o.offerType,
          frameBrand: o.frameBrand,
          frameSubCategory: o.frameSubCategory,
          minFrameMRP: o.minFrameMRP,
          maxFrameMRP: o.maxFrameMRP,
          lensBrandLines: o.lensBrandLines,
          lensItCodes: o.lensItCodes || [],
          discountType: o.discountType,
          discountValue: o.discountValue,
          comboPrice: o.comboPrice,
          freeProductId: o.freeProductId ? o.freeProductId.toString() : null,
          isSecondPairRule: o.isSecondPairRule || false,
          secondPairPercent: o.secondPairPercent,
          priority: o.priority,
          isActive: o.isActive,
          startDate: o.startDate,
          endDate: o.endDate
        }))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(listOfferRulesHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createOfferRuleHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;
