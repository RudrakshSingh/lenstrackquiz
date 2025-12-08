// pages/api/admin/category-discounts/[id].js
// Get, Update, Delete Category Discount

import { withAuth } from '../../../../middleware/auth';
import { getCategoryDiscountById, updateCategoryDiscount, deleteCategoryDiscount } from '../../../../models/CategoryDiscount';
import { handleError } from '../../../../lib/errors';

// GET /api/admin/category-discounts/:id
async function getCategoryDiscountHandler(req, res) {
  try {
    const { id } = req.query;
    const discount = await getCategoryDiscountById(id);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category discount not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: discount._id.toString(),
        customerCategory: discount.customerCategory,
        brandCode: discount.brandCode,
        discountPercent: discount.discountPercent,
        maxDiscount: discount.maxDiscount,
        isActive: discount.isActive
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/category-discounts/:id
async function updateCategoryDiscountHandler(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    const discount = await updateCategoryDiscount(id, updateData);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category discount not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: discount._id.toString(),
        customerCategory: discount.customerCategory,
        brandCode: discount.brandCode
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/admin/category-discounts/:id
async function deleteCategoryDiscountHandler(req, res) {
  try {
    const { id } = req.query;
    const result = await deleteCategoryDiscount(id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category discount not found' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category discount deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return getCategoryDiscountHandler(req, res);
  }
  if (req.method === 'PUT') {
    return updateCategoryDiscountHandler(req, res);
  }
  if (req.method === 'DELETE') {
    return deleteCategoryDiscountHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN');

