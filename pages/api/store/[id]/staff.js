// pages/api/store/[id]/staff.js
// GET /api/store/{id}/staff - Returns staff for that store (V1.0 Spec)

import { getStaffByStore } from '../../../../models/Staff';
import { handleError } from '../../../../lib/errors';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Store ID is required' }
      });
    }

    // V1.0 Spec: Get staff for store
    const staff = await getStaffByStore(id);
    
    // Format response
    const formattedStaff = staff.map(s => ({
      id: s._id.toString(),
      name: s.name,
      phone: s.phone || null,
      role: s.role,
      status: s.status
    }));

    return res.status(200).json({
      success: true,
      staff: formattedStaff
    });
  } catch (error) {
    console.error('Store staff error:', error);
    return handleError(error, res);
  }
}

