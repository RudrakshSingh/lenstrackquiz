// pages/api/admin/retail-products/index.js
// Retail Product Management (Frames, Sunglasses, Contact Lenses, Accessories)

import { withAuth } from '../../../../middleware/auth';
import { createRetailProduct, getAllRetailProducts, getRetailProductBySku, RetailProductType } from '../../../../models/RetailProduct';
import { getProductBrandById } from '../../../../models/ProductBrand';
import { getProductSubBrandById } from '../../../../models/ProductSubBrand';
import { handleError, ConflictError } from '../../../../lib/errors';

// GET /api/admin/retail-products
async function listRetailProductsHandler(req, res) {
  try {
    const { type, brandId, subBrandId, isActive, organizationId, search } = req.query;
    const user = req.user;

    const filter = {};
    
    // Filter by type (FRAME, SUNGLASS, CONTACT_LENS, ACCESSORY)
    if (type) {
      if (!Object.values(RetailProductType).includes(type)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid product type. Must be one of: ${Object.values(RetailProductType).join(', ')}` }
        });
      }
      filter.type = type;
    }

    // Filter by organization
    const orgId = organizationId || user.organizationId;
    if (orgId) {
      filter.organizationId = orgId;
    }

    if (brandId) filter.brandId = brandId;
    if (subBrandId) filter.subBrandId = subBrandId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await getAllRetailProducts(filter);

    // Populate brand and sub-brand names
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const brand = await getProductBrandById(product.brandId);
        let subBrand = null;
        if (product.subBrandId) {
          subBrand = await getProductSubBrandById(product.subBrandId);
        }

        return {
          id: product._id.toString(),
          type: product.type,
          brandId: product.brandId.toString(),
          brandName: brand ? brand.name : null,
          subBrandId: product.subBrandId ? product.subBrandId.toString() : null,
          subBrandName: subBrand ? subBrand.name : null,
          name: product.name,
          sku: product.sku,
          mrp: product.mrp,
          hsnCode: product.hsnCode,
          isActive: product.isActive !== undefined ? product.isActive : true,
          organizationId: product.organizationId ? product.organizationId.toString() : null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        products: productsWithDetails,
        total: productsWithDetails.length
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/admin/retail-products
async function createRetailProductHandler(req, res) {
  try {
    const user = req.user;
    const { type, brandId, subBrandId, name, sku, mrp, hsnCode, isActive } = req.body;

    // Validation
    if (!type || !Object.values(RetailProductType).includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `type is required and must be one of: ${Object.values(RetailProductType).join(', ')}` }
      });
    }

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'brandId is required' }
      });
    }

    if (!mrp || isNaN(parseFloat(mrp)) || parseFloat(mrp) < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'mrp is required and must be a positive number' }
      });
    }

    // Validate brand exists
    const brand = await getProductBrandById(brandId);
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Brand not found' }
      });
    }

    // Validate sub-brand exists if provided
    if (subBrandId) {
      const subBrand = await getProductSubBrandById(subBrandId);
      if (!subBrand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sub-brand not found' }
        });
      }
      // Verify sub-brand belongs to the brand
      if (subBrand.brandId.toString() !== brandId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Sub-brand does not belong to the specified brand' }
        });
      }
    }

    // Check if SKU already exists (if provided)
    if (sku) {
      const orgId = user.organizationId;
      if (orgId) {
        const existing = await getRetailProductBySku(orgId, sku);
        if (existing) {
          throw new ConflictError('Product SKU already exists');
        }
      }
    }

    const product = await createRetailProduct({
      type,
      brandId,
      subBrandId: subBrandId || null,
      name: name || null,
      sku: sku || null,
      mrp: parseFloat(mrp),
      hsnCode: hsnCode || null,
      isActive: isActive !== undefined ? isActive : true,
      organizationId: user.organizationId || null
    });

    return res.status(201).json({
      success: true,
      data: {
        id: product._id.toString(),
        type: product.type,
        brandId: product.brandId.toString(),
        brandName: brand.name,
        subBrandId: product.subBrandId ? product.subBrandId.toString() : null,
        subBrandName: subBrandId ? (await getProductSubBrandById(subBrandId)).name : null,
        name: product.name,
        sku: product.sku,
        mrp: product.mrp,
        hsnCode: product.hsnCode,
        isActive: product.isActive
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(listRetailProductsHandler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE')(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createRetailProductHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

