// pages/api/auth/session.js
// Get current session/user info

import { withAuth } from '../../../middleware/auth';
import { getStoreById } from '../../../models/Store';
import { handleError } from '../../../lib/errors';

async function handler(req, res) {
  try {
    const user = req.user;
    
    // Get store info if user has storeId
    let storeName = null;
    if (user.storeId) {
      const store = await getStoreById(user.storeId);
      storeName = store?.name || null;
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId ? user.storeId.toString() : null,
          storeName,
          organizationId: user.organizationId.toString()
        }
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler);
