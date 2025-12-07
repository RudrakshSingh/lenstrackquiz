// pages/api/order/create.js
// POST /api/order/create - Creates a new order (V1.0 Spec)

import { createOrder } from '../../../models/Order';
import { OrderStatus } from '../../../models/Order';
import { handleError } from '../../../lib/errors';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const {
      storeId,
      salesMode,
      assistedByStaffId,
      assistedByName,
      customerName,
      customerPhone,
      frameData,
      lensData,
      offerData,
      finalPrice
    } = req.body;

    // V1.0 Spec: Validation
    if (!storeId || !salesMode || finalPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'storeId, salesMode, and finalPrice are required' }
      });
    }

    // V1.0 Spec: Validation rules
    if (salesMode === 'STAFF_ASSISTED' && !assistedByStaffId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'assistedByStaffId is required for STAFF_ASSISTED mode' }
      });
    }

    if (!frameData || !lensData) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'frameData and lensData are required' }
      });
    }

    // Create order
    const order = await createOrder({
      storeId,
      salesMode,
      assistedByStaffId,
      assistedByName,
      customerName,
      customerPhone,
      frameData,
      lensData,
      offerData,
      finalPrice
    });

    return res.status(201).json({
      success: true,
      orderId: order._id.toString(),
      status: OrderStatus.DRAFT
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return handleError(error, res);
  }
}

