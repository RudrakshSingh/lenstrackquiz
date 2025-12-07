// pages/api/order/store-accept.js
// POST /api/order/store-accept - Moves CUSTOMER_CONFIRMED → STORE_ACCEPTED (V1.0 Spec)

import { acceptOrderByStore, getOrderById } from '../../../models/Order';
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
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderId is required' }
      });
    }

    // Check current status
    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }

    if (order.status !== OrderStatus.CUSTOMER_CONFIRMED) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Order must be in CUSTOMER_CONFIRMED status. Current status: ${order.status}` }
      });
    }

    // Accept order
    const updatedOrder = await acceptOrderByStore(orderId);

    return res.status(200).json({
      success: true,
      orderId: updatedOrder._id.toString(),
      status: updatedOrder.status
    });
  } catch (error) {
    console.error('Order acceptance error:', error);
    return handleError(error, res);
  }
}

