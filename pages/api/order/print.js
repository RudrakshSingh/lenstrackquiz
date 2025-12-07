// pages/api/order/print.js
// POST /api/order/print - Triggers print job (V1.0 Spec)

import { printOrder, getOrderById } from '../../../models/Order';
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

    if (order.status !== OrderStatus.STORE_ACCEPTED) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Order must be in STORE_ACCEPTED status. Current status: ${order.status}` }
      });
    }

    // Print order (updates status to PRINTED)
    const updatedOrder = await printOrder(orderId);

    // TODO: Trigger actual print job here
    // This would integrate with POS print system

    return res.status(200).json({
      success: true,
      orderId: updatedOrder._id.toString(),
      status: updatedOrder.status,
      message: 'Print job triggered'
    });
  } catch (error) {
    console.error('Order print error:', error);
    return handleError(error, res);
  }
}

