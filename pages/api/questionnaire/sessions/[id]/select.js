// pages/api/questionnaire/sessions/[id]/select.js
// Record product selection (conversion)

import { withAuth } from '../../../../../middleware/auth';
import { getSessionById, updateSession } from '../../../../../models/Session';
import { updateSessionRecommendation } from '../../../../../models/SessionRecommendation';
import { handleError, NotFoundError, ValidationError } from '../../../../../lib/errors';
import { z } from 'zod';

const SelectProductSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  notes: z.string().optional()
});

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

    if (session.status !== 'COMPLETED') {
      throw new ValidationError('Session must be completed before selecting a product');
    }

    // Validate input
    const validationResult = SelectProductSchema.safeParse(req.body);
    if (!validationResult.success) {
      const details = {};
      validationResult.error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(err.message);
      });
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details }
      });
    }

    // Update recommendation to mark as selected
    await updateSessionRecommendation(sessionId, validationResult.data.productId, {
      isSelected: true
    });

    // Update session status to CONVERTED
    await updateSession(sessionId, {
      status: 'CONVERTED',
      convertedAt: new Date(),
      notes: validationResult.data.notes || session.notes
    });

    return res.status(200).json({
      success: true,
      message: 'Product selected successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

