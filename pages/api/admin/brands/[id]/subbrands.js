// pages/api/admin/brands/[id]/subbrands.js
// Sub-brand management for a specific brand

import { withAuth } from '../../../../../middleware/auth';
import { getProductBrandById } from '../../../../../models/ProductBrand';
import { createProductSubBrand, getProductSubBrandsByBrand } from '../../../../../models/ProductSubBrand';
import { handleError } from '../../../../../lib/errors';

// POST /api/admin/brands/:id/subbrands
async function createSubBrandHandler(req, res) {
  try {
    const { id: brandId } = req.query;
    const { name, offerRuleIds, isActive } = req.body;

    // Validate brand exists
    const brand = await getProductBrandById(brandId);
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Brand not found' }
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Sub-brand name is required' }
      });
    }

    // Check if sub-brand already exists for this brand
    const existingSubBrands = await getProductSubBrandsByBrand(brandId);
    const duplicate = existingSubBrands.find(sb => sb.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Sub-brand name already exists for this brand' }
      });
    }

    const subBrand = await createProductSubBrand({
      brandId,
      name,
      offerRuleIds: offerRuleIds || [],
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      data: {
        id: subBrand._id.toString(),
        name: subBrand.name,
        offerRuleIds: subBrand.offerRuleIds,
        isActive: subBrand.isActive
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// GET /api/admin/brands/:id/subbrands
async function listSubBrandsHandler(req, res) {
  try {
    const { id: brandId } = req.query;

    const brand = await getProductBrandById(brandId);
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Brand not found' }
      });
    }

    const subBrands = await getProductSubBrandsByBrand(brandId);

    return res.status(200).json({
      success: true,
      data: subBrands.map(sb => ({
        id: sb._id.toString(),
        name: sb.name,
        offerRuleIds: sb.offerRuleIds || [],
        isActive: sb.isActive !== undefined ? sb.isActive : true
      }))
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(listSubBrandsHandler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER')(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createSubBrandHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

