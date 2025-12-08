// pages/api/admin/retail-products/[id].js
// Retail Product update and delete

import { withAuth } from '../../../../middleware/auth';
import { getRetailProductById, updateRetailProduct, deleteRetailProduct } from '../../../../models/RetailProduct';
import { getProductBrandById } from '../../../../models/ProductBrand';
import { getProductSubBrandById } from '../../../../models/ProductSubBrand';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      const product = await getRetailProductById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Product not found' }
        });
      }

      const brand = await getProductBrandById(product.brandId);
      let subBrand = null;
      if (product.subBrandId) {
        subBrand = await getProductSubBrandById(product.subBrandId);
      }

      return res.status(200).json({
        success: true,
        data: {
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
          isActive: product.isActive,
          organizationId: product.organizationId ? product.organizationId.toString() : null
        }
      });
    }

    if (req.method === 'PUT') {
      const { type, brandId, subBrandId, name, sku, mrp, hsnCode, isActive } = req.body;

      const product = await getRetailProductById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Product not found' }
        });
      }

      const updateData = {};
      if (type !== undefined) updateData.type = type;
      if (brandId !== undefined) {
        // Validate brand exists
        const brand = await getProductBrandById(brandId);
        if (!brand) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Brand not found' }
          });
        }
        updateData.brandId = brandId;
      }
      if (subBrandId !== undefined) {
        if (subBrandId) {
          // Validate sub-brand exists
          const subBrand = await getProductSubBrandById(subBrandId);
          if (!subBrand) {
            return res.status(404).json({
              success: false,
              error: { code: 'NOT_FOUND', message: 'Sub-brand not found' }
            });
          }
          // Verify sub-brand belongs to the brand
          const finalBrandId = brandId || product.brandId.toString();
          if (subBrand.brandId.toString() !== finalBrandId) {
            return res.status(400).json({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Sub-brand does not belong to the specified brand' }
            });
          }
        }
        updateData.subBrandId = subBrandId || null;
      }
      if (name !== undefined) updateData.name = name;
      if (sku !== undefined) updateData.sku = sku;
      if (mrp !== undefined) {
        if (isNaN(parseFloat(mrp)) || parseFloat(mrp) < 0) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'mrp must be a positive number' }
          });
        }
        updateData.mrp = parseFloat(mrp);
      }
      if (hsnCode !== undefined) updateData.hsnCode = hsnCode;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await updateRetailProduct(id, updateData);

      const brand = await getProductBrandById(updated.brandId);
      let subBrand = null;
      if (updated.subBrandId) {
        subBrand = await getProductSubBrandById(updated.subBrandId);
      }

      return res.status(200).json({
        success: true,
        data: {
          id: updated._id.toString(),
          type: updated.type,
          brandId: updated.brandId.toString(),
          brandName: brand ? brand.name : null,
          subBrandId: updated.subBrandId ? updated.subBrandId.toString() : null,
          subBrandName: subBrand ? subBrand.name : null,
          name: updated.name,
          sku: updated.sku,
          mrp: updated.mrp,
          hsnCode: updated.hsnCode,
          isActive: updated.isActive
        }
      });
    }

    if (req.method === 'DELETE') {
      const product = await getRetailProductById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Product not found' }
        });
      }

      await deleteRetailProduct(id);

      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN');

