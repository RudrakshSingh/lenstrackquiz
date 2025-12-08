// pages/api/admin/brands/index.js
// Generic Brand Management (not tied to frame only)

import { withAuth } from '../../../../middleware/auth';
import { createProductBrand, getAllProductBrands, getProductBrandByName } from '../../../../models/ProductBrand';
import { getProductSubBrandsByBrand, deleteProductSubBrandsByBrand } from '../../../../models/ProductSubBrand';
import { handleError } from '../../../../lib/errors';

// GET /api/admin/brands
async function listBrandsHandler(req, res) {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const brands = await getAllProductBrands(filter);
    
    // Get sub-brands for each brand
    const brandsWithSubBrands = await Promise.all(
      brands.map(async (brand) => {
        const subBrands = await getProductSubBrandsByBrand(brand._id);
        return {
          id: brand._id.toString(),
          name: brand.name,
          isActive: brand.isActive !== undefined ? brand.isActive : true,
          subBrands: subBrands.map(sb => ({
            id: sb._id.toString(),
            name: sb.name,
            offerRuleIds: sb.offerRuleIds || [],
            isActive: sb.isActive !== undefined ? sb.isActive : true
          })),
          createdAt: brand.createdAt,
          updatedAt: brand.updatedAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: brandsWithSubBrands
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/admin/brands
async function createBrandHandler(req, res) {
  try {
    const { name, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Brand name is required' }
      });
    }

    // Check if brand already exists
    const existing = await getProductBrandByName(name);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Brand name already exists' }
      });
    }

    const brand = await createProductBrand({
      name,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      data: {
        id: brand._id.toString(),
        name: brand.name,
        isActive: brand.isActive
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(listBrandsHandler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER')(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createBrandHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

