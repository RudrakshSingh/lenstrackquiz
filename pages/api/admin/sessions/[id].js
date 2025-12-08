// pages/api/admin/sessions/[id].js
// GET /api/admin/sessions/[id] - Get session details

import { withAuth } from '../../../../middleware/auth';
import { getSessionById } from '../../../../models/Session';
import { getStoreById } from '../../../../models/Store';
import { getUserById } from '../../../../models/User';
import { handleError } from '../../../../lib/errors';
import { ObjectId } from 'mongodb';

async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }

    const { id } = req.query;
    const user = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' }
      });
    }

    // Get session
    const session = await getSessionById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' }
      });
    }

    // Check authorization - users can only see their own sessions unless admin
    if (user.role === 'SALES_EXECUTIVE' && session.userId?.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    if (user.role === 'STORE_MANAGER' && user.storeId && session.storeId?.toString() !== user.storeId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    // Enrich with store and user data
    let store = null;
    let userData = null;

    if (session.storeId) {
      try {
        store = await getStoreById(session.storeId);
      } catch (error) {
        console.error('Error fetching store:', error);
      }
    }

    if (session.userId) {
      try {
        userData = await getUserById(session.userId);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    const enrichedSession = {
      id: session._id.toString(),
      storeId: session.storeId?.toString() || null,
      userId: session.userId?.toString() || null,
      customerName: session.customerName || null,
      customerPhone: session.customerPhone || null,
      customerEmail: session.customerEmail || null,
      category: session.category || null,
      status: session.status || 'IN_PROGRESS',
      startedAt: session.startedAt || session.createdAt || null,
      completedAt: session.completedAt || null,
      convertedAt: session.convertedAt || null,
      abandonedAt: session.abandonedAt || null,
      notes: session.notes || null,
      store: store ? {
        id: store._id?.toString(),
        name: store.name,
        code: store.code
      } : null,
      storeName: store?.name || null,
      user: userData ? {
        id: userData._id?.toString(),
        name: userData.name,
        email: userData.email
      } : null,
      userName: userData?.name || null
    };

    return res.status(200).json({
      success: true,
      data: enrichedSession
    });
  } catch (error) {
    console.error('Session detail error:', error);
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

