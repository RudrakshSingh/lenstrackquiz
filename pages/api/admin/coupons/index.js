// pages/api/admin/coupons/index.js
// Coupon CRUD endpoints

import { withAuth } from '../../../../middleware/auth';
import { createCoupon, getAllCoupons, getCouponByCode } from '../../../../models/Coupon';
import { handleError } from '../../../../lib/errors';

// POST /api/admin/coupons
async function createCouponHandler(req, res) {
  try {
    const { code, description, minCartValue, maxUsagePerUser, maxUsageGlobal, discountType, discountValue, maxDiscount, isActive, startDate, endDate } = req.body;

    // Validation
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'code, discountType, and discountValue are required' }
      });
    }

    // Check if code already exists
    const existing = await getCouponByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Coupon code already exists' }
      });
    }

    const coupon = await createCoupon({
      code,
      description,
      minCartValue,
      maxUsagePerUser,
      maxUsageGlobal,
      discountType,
      discountValue,
      maxDiscount,
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate
    });

    return res.status(201).json({
      success: true,
      data: {
        id: coupon._id.toString(),
        code: coupon.code
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// GET /api/admin/coupons
async function listCouponsHandler(req, res) {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const coupons = await getAllCoupons(filter);
    
    return res.status(200).json({
      success: true,
      data: {
        coupons: coupons.map(c => ({
          id: c._id.toString(),
          code: c.code,
          description: c.description,
          minCartValue: c.minCartValue,
          maxUsagePerUser: c.maxUsagePerUser,
          maxUsageGlobal: c.maxUsageGlobal,
          discountType: c.discountType,
          discountValue: c.discountValue,
          maxDiscount: c.maxDiscount,
          isActive: c.isActive,
          startDate: c.startDate,
          endDate: c.endDate
        }))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(listCouponsHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createCouponHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

