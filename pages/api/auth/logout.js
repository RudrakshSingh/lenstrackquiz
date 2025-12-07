// pages/api/auth/logout.js
// Logout endpoint (token invalidation handled client-side)

import { withAuth } from '../../../middleware/auth';
import { handleError } from '../../../lib/errors';

async function handler(req, res) {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement token blacklisting here if needed
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler);
