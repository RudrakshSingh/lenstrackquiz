// pages/api/admin/lens-brands/[id].js
// Lens Brand update and delete

import { withAuth } from '../../../../middleware/auth';
import { getLensBrandById, updateLensBrand, deleteLensBrand } from '../../../../models/LensBrand';
import { getAllLensProducts } from '../../../../models/LensProduct';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      const brand = await getLensBrandById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lens brand not found' }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: brand._id.toString(),
          name: brand.name,
          description: brand.description,
          isActive: brand.isActive
        }
      });
    }

    if (req.method === 'PUT') {
      const { name, description, isActive } = req.body;

      const brand = await getLensBrandById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lens brand not found' }
        });
      }

      // If name is being changed, check for duplicates
      if (name && name.trim() !== brand.name) {
        const { getLensBrandByName } = await import('../../../../models/LensBrand');
        const existing = await getLensBrandByName(name);
        if (existing && existing._id.toString() !== id) {
          return res.status(409).json({
            success: false,
            error: { code: 'RESOURCE_CONFLICT', message: 'Lens brand name already exists' }
          });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await updateLensBrand(id, updateData);

      return res.status(200).json({
        success: true,
        data: {
          id: updated._id.toString(),
          name: updated.name,
          description: updated.description,
          isActive: updated.isActive
        }
      });
    }

    if (req.method === 'DELETE') {
      const brand = await getLensBrandById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lens brand not found' }
        });
      }

      // Check if brand is used in any lens products
      const products = await getAllLensProducts({ lensBrandId: id });
      if (products.length > 0) {
        return res.status(409).json({
          success: false,
          error: { 
            code: 'RESOURCE_IN_USE', 
            message: `Cannot delete lens brand. It is used by ${products.length} lens product(s).` 
          }
        });
      }

      await deleteLensBrand(id);

      return res.status(200).json({
        success: true,
        message: 'Lens brand deleted successfully'
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

