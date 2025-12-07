// pages/api/order/confirm.js
// POST /api/order/confirm - Moves DRAFT → CUSTOMER_CONFIRMED (V1.0 Spec)

import { confirmOrder, getOrderById } from '../../../models/Order';
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

    if (order.status !== OrderStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Order must be in DRAFT status. Current status: ${order.status}` }
      });
    }

    // Confirm order
    const updatedOrder = await confirmOrder(orderId);

    return res.status(200).json({
      success: true,
      orderId: updatedOrder._id.toString(),
      status: updatedOrder.status
    });
  } catch (error) {
    console.error('Order confirmation error:', error);
    return handleError(error, res);
  }
}

