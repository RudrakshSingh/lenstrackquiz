// pages/api/admin/coupons/[id].js
// Get, Update, Delete Coupon

import { withAuth } from '../../../../middleware/auth';
import { getCouponById, updateCoupon, deleteCoupon } from '../../../../models/Coupon';
import { handleError } from '../../../../lib/errors';

// GET /api/admin/coupons/:id
async function getCouponHandler(req, res) {
  try {
    const { id } = req.query;
    const coupon = await getCouponById(id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Coupon not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: coupon._id.toString(),
        code: coupon.code,
        description: coupon.description,
        minCartValue: coupon.minCartValue,
        maxUsagePerUser: coupon.maxUsagePerUser,
        maxUsageGlobal: coupon.maxUsageGlobal,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        isActive: coupon.isActive,
        startDate: coupon.startDate,
        endDate: coupon.endDate
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/coupons/:id
async function updateCouponHandler(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    const coupon = await updateCoupon(id, updateData);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Coupon not found' }
      });
    }

    return res.status(200).json({
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

// DELETE /api/admin/coupons/:id
async function deleteCouponHandler(req, res) {
  try {
    const { id } = req.query;
    const result = await deleteCoupon(id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Coupon not found' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return getCouponHandler(req, res);
  }
  if (req.method === 'PUT') {
    return withAuth(updateCouponHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  if (req.method === 'DELETE') {
    return withAuth(deleteCouponHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

