// pages/api/questionnaire/sessions/[id]/abandon.js
// Mark session as abandoned

import { withAuth } from '../../../../../middleware/auth';
import { getSessionById, updateSession } from '../../../../../models/Session';
import { handleError, NotFoundError } from '../../../../../lib/errors';

async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }

    const { id: sessionId } = req.query;

    // Get session
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Update session status to ABANDONED
    await updateSession(sessionId, {
      status: 'ABANDONED',
      abandonedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Session marked as abandoned'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

