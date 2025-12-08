// pages/api/admin/brands/[id].js
// Brand update and delete

import { withAuth } from '../../../../middleware/auth';
import { getProductBrandById, updateProductBrand, deleteProductBrand } from '../../../../models/ProductBrand';
import { deleteProductSubBrandsByBrand } from '../../../../models/ProductSubBrand';
import { getAllRetailProducts } from '../../../../models/RetailProduct';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  try {
    const { id } = req.query;
    // Support both 'id' and 'brandId' for compatibility
    const brandId = id;

    if (req.method === 'GET') {
      const brand = await getProductBrandById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Brand not found' }
        });
      }

      const { getProductSubBrandsByBrand } = await import('../../../../models/ProductSubBrand');
      const subBrands = await getProductSubBrandsByBrand(brand._id);

      return res.status(200).json({
        success: true,
        data: {
          id: brand._id.toString(),
          name: brand.name,
          isActive: brand.isActive,
          subBrands: subBrands.map(sb => ({
            id: sb._id.toString(),
            name: sb.name,
            offerRuleIds: sb.offerRuleIds || [],
            isActive: sb.isActive
          }))
        }
      });
    }

    if (req.method === 'PUT') {
      const { name, isActive } = req.body;

      const brand = await getProductBrandById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Brand not found' }
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await updateProductBrand(id, updateData);

      return res.status(200).json({
        success: true,
        data: {
          id: updated._id.toString(),
          name: updated.name,
          isActive: updated.isActive
        }
      });
    }

    if (req.method === 'DELETE') {
      const brand = await getProductBrandById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Brand not found' }
        });
      }

      // Check if brand is used in any retail products
      const products = await getAllRetailProducts({ brandId: id });
      if (products.length > 0) {
        return res.status(409).json({
          success: false,
          error: { 
            code: 'RESOURCE_IN_USE', 
            message: `Cannot delete brand. It is used by ${products.length} product(s).` 
          }
        });
      }

      // Delete all sub-brands first
      await deleteProductSubBrandsByBrand(id);
      
      // Delete brand
      await deleteProductBrand(id);

      return res.status(200).json({
        success: true,
        message: 'Brand deleted successfully'
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

