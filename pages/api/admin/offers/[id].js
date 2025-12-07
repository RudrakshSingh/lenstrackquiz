// pages/api/admin/offers/[id].js
// Get, Update, Delete Offer Rule

import { withAuth } from '../../../../middleware/auth';
import { getOfferRuleById, updateOfferRule, deleteOfferRule } from '../../../../models/OfferRule';
import { handleError } from '../../../../lib/errors';

// GET /api/admin/offers/:id
async function getOfferRuleHandler(req, res) {
  try {
    const { id } = req.query;
    const offer = await getOfferRuleById(id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Offer rule not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: offer._id.toString(),
        name: offer.name,
        code: offer.code,
        offerType: offer.offerType,
        frameBrand: offer.frameBrand,
        frameSubCategory: offer.frameSubCategory,
        minFrameMRP: offer.minFrameMRP,
        maxFrameMRP: offer.maxFrameMRP,
        lensBrandLines: offer.lensBrandLines,
        lensItCodes: offer.lensItCodes || [],
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        comboPrice: offer.comboPrice,
        freeProductId: offer.freeProductId ? offer.freeProductId.toString() : null,
        isSecondPairRule: offer.isSecondPairRule || false,
        secondPairPercent: offer.secondPairPercent,
        priority: offer.priority,
        isActive: offer.isActive,
        startDate: offer.startDate,
        endDate: offer.endDate
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/offers/:id
async function updateOfferRuleHandler(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    const offer = await updateOfferRule(id, updateData);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Offer rule not found' }
      });
    }

    return res.status(200).json({
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

// DELETE /api/admin/offers/:id
async function deleteOfferRuleHandler(req, res) {
  try {
    const { id } = req.query;
    const result = await deleteOfferRule(id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Offer rule not found' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Offer rule deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return getOfferRuleHandler(req, res);
  }
  if (req.method === 'PUT') {
    return withAuth(updateOfferRuleHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  if (req.method === 'DELETE') {
    return withAuth(deleteOfferRuleHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;
