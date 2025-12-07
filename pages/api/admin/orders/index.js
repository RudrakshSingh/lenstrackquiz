// pages/api/admin/orders/index.js
// GET /api/admin/orders - List orders (V1.0 Spec)

import { withAuth } from '../../../../middleware/auth';
import { getAllOrders } from '../../../../models/Order';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const { storeId, status, salesMode, limit = 50 } = req.query;

    const filter = {};
    if (storeId) filter.storeId = storeId;
    if (status) filter.status = status;
    if (salesMode) filter.salesMode = salesMode;

    // V1.0 Spec: Get orders
    const orders = await getAllOrders(filter);
    
    // Limit results
    const limitedOrders = orders.slice(0, parseInt(limit));

    // Format response
    const formattedOrders = limitedOrders.map(order => ({
      id: order._id.toString(),
      storeId: order.storeId.toString(),
      salesMode: order.salesMode,
      assistedByStaffId: order.assistedByStaffId ? order.assistedByStaffId.toString() : null,
      assistedByName: order.assistedByName || null,
      customerName: order.customerName || null,
      customerPhone: order.customerPhone || null,
      frameData: order.frameData || {},
      lensData: order.lensData || {},
      offerData: order.offerData || {},
      finalPrice: order.finalPrice || 0,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        total: orders.length
      }
    });
  } catch (error) {
    console.error('List orders error:', error);
    return handleError(error, res);
  }
}

export default withAuth(handler);

