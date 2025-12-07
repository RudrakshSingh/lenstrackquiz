// pages/api/admin/orders/statistics.js
// GET /api/admin/orders/statistics - Get order statistics for store dashboard (V1.0 Spec)

import { withAuth } from '../../../../middleware/auth';
import { getOrderStatistics } from '../../../../models/Order';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const { storeId, startDate, endDate } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'storeId is required' }
      });
    }

    // V1.0 Spec: Get order statistics
    const stats = await getOrderStatistics(storeId, {
      startDate: startDate || null,
      endDate: endDate || null
    });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Order statistics error:', error);
    return handleError(error, res);
  }
}

export default withAuth(handler);

