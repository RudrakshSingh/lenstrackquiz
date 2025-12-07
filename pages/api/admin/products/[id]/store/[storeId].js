// pages/api/admin/products/[id]/store/[storeId].js
// Update store-specific product data

import { withAuth } from '../../../../../../middleware/auth';
import { updateStoreProduct } from '../../../../../../models/StoreProduct';
import { handleError } from '../../../../../../lib/errors';
import { z } from 'zod';

const UpdateStoreProductSchema = z.object({
  stockQuantity: z.number().int().min(0).optional(),
  priceOverride: z.number().min(0).nullable().optional(),
  isAvailable: z.boolean().optional()
});

async function handler(req, res) {
  try {
    const { id: productId, storeId } = req.query;
    const user = req.user;

    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }

    // Validate input
    const validationResult = UpdateStoreProductSchema.safeParse(req.body);
    if (!validationResult.success) {
      const details = {};
      validationResult.error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(err.message);
      });
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details }
      });
    }

    const updated = await updateStoreProduct(storeId, productId, validationResult.data);

    return res.status(200).json({
      success: true,
      data: {
        id: updated._id.toString(),
        storeId: updated.storeId.toString(),
        productId: updated.productId.toString(),
        stockQuantity: updated.stockQuantity,
        priceOverride: updated.priceOverride,
        isAvailable: updated.isAvailable,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER');

