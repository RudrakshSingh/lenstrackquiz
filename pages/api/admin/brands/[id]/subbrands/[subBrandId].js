// pages/api/admin/brands/[id]/subbrands/[subBrandId].js
// Sub-brand update and delete

import { withAuth } from '../../../../../../middleware/auth';
import { getProductSubBrandById, updateProductSubBrand, deleteProductSubBrand } from '../../../../../../models/ProductSubBrand';
import { getAllRetailProducts } from '../../../../../../models/RetailProduct';
import { handleError } from '../../../../../../lib/errors';

async function handler(req, res) {
  try {
    const { id: brandId, subBrandId } = req.query;

    if (req.method === 'PUT') {
      const { name, offerRuleIds, isActive } = req.body;

      const subBrand = await getProductSubBrandById(subBrandId);
      if (!subBrand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sub-brand not found' }
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (offerRuleIds !== undefined) updateData.offerRuleIds = offerRuleIds;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await updateProductSubBrand(subBrandId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sub-brand not found or update failed' }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: updated._id.toString(),
          name: updated.name,
          offerRuleIds: updated.offerRuleIds || [],
          isActive: updated.isActive !== undefined ? updated.isActive : true
        }
      });
    }

    if (req.method === 'DELETE') {
      const subBrand = await getProductSubBrandById(subBrandId);
      if (!subBrand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sub-brand not found' }
        });
      }

      // Check if sub-brand is used in any retail products
      const products = await getAllRetailProducts({ subBrandId: subBrandId });
      if (products.length > 0) {
        return res.status(409).json({
          success: false,
          error: { 
            code: 'RESOURCE_IN_USE', 
            message: `Cannot delete sub-brand. It is used by ${products.length} product(s).` 
          }
        });
      }

      await deleteProductSubBrand(subBrandId);

      return res.status(200).json({
        success: true,
        message: 'Sub-brand deleted successfully'
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

