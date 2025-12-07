// pages/api/order/push-to-lab.js
// POST /api/order/push-to-lab - Moves PRINTED → PUSHED_TO_LAB (V1.0 Spec)

import { pushOrderToLab, getOrderById } from '../../../models/Order';
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

    if (order.status !== OrderStatus.PRINTED) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Order must be in PRINTED status. Current status: ${order.status}` }
      });
    }

    // Push to lab
    const updatedOrder = await pushOrderToLab(orderId);

    // TODO: Sync with lab system here
    // This would integrate with lab workflow system

    return res.status(200).json({
      success: true,
      orderId: updatedOrder._id.toString(),
      status: updatedOrder.status,
      message: 'Order pushed to lab'
    });
  } catch (error) {
    console.error('Push to lab error:', error);
    return handleError(error, res);
  }
}

