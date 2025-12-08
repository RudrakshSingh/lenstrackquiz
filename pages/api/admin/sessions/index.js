// pages/api/admin/sessions/index.js
// GET /api/admin/sessions - List sessions

import { withAuth } from '../../../../middleware/auth';
import { getAllSessions } from '../../../../models/Session';
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

    const { limit, status, category, organizationId, storeId, userId } = req.query;
    const user = req.user;

    // Build filter
    const filter = {};

    // Role-based filtering
    if (user.role === 'STORE_MANAGER' && user.storeId) {
      filter.storeId = typeof user.storeId === 'string' ? new ObjectId(user.storeId) : user.storeId;
    } else if (user.role === 'SALES_EXECUTIVE') {
      filter.userId = typeof user._id === 'string' ? new ObjectId(user._id) : user._id;
    } else if (storeId) {
      filter.storeId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
    }

    if (userId) {
      filter.userId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    }

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    // Get sessions
    let sessions = await getAllSessions(filter);

    // If organizationId is provided, filter by stores in that organization
    if (organizationId && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
      const { getAllStores } = await import('../../../../models/Store');
      const stores = await getAllStores({ organizationId: new ObjectId(organizationId) });
      const storeIds = stores.map(s => s._id);
      sessions = sessions.filter(s => storeIds.some(id => id.toString() === s.storeId?.toString()));
    }

    // Limit results
    if (limit) {
      sessions = sessions.slice(0, parseInt(limit));
    }

    // Enrich sessions with store and user data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
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

        return {
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
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedSessions
    });
  } catch (error) {
    console.error('Sessions list error:', error);
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

