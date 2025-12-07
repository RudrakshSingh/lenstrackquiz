// pages/api/admin/category-discounts/index.js
// Category Discount CRUD endpoints

import { withAuth } from '../../../../middleware/auth';
import { createCategoryDiscount, getAllCategoryDiscounts, getCategoryDiscountByCategoryAndBrand } from '../../../../models/CategoryDiscount';
import { handleError } from '../../../../lib/errors';

// POST /api/admin/category-discounts
async function createCategoryDiscountHandler(req, res) {
  try {
    const { customerCategory, brandCode, discountPercent, maxDiscount, isActive } = req.body;

    // Validation
    if (!customerCategory || !brandCode || discountPercent === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'customerCategory, brandCode, and discountPercent are required' }
      });
    }

    // Check if already exists
    const existing = await getCategoryDiscountByCategoryAndBrand(customerCategory, brandCode);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Category discount already exists for this category and brand' }
      });
    }

    const discount = await createCategoryDiscount({
      customerCategory,
      brandCode,
      discountPercent,
      maxDiscount,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
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

// GET /api/admin/category-discounts
async function listCategoryDiscountsHandler(req, res) {
  try {
    const { isActive, customerCategory, brandCode } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (customerCategory) filter.customerCategory = customerCategory;
    if (brandCode) filter.brandCode = brandCode;

    const discounts = await getAllCategoryDiscounts(filter);
    
    return res.status(200).json({
      success: true,
      data: {
        discounts: discounts.map(d => ({
          id: d._id.toString(),
          customerCategory: d.customerCategory,
          brandCode: d.brandCode,
          discountPercent: d.discountPercent,
          maxDiscount: d.maxDiscount,
          isActive: d.isActive
        }))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return listCategoryDiscountsHandler(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createCategoryDiscountHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

