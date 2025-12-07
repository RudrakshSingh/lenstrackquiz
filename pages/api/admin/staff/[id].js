// pages/api/admin/staff/[id].js
// Staff management endpoints (V1.0 Spec)

import { withAuth, authorize } from '../../../../middleware/auth';
import { getStaffById, updateStaff, deleteStaff } from '../../../../models/Staff';
import { handleError } from '../../../../lib/errors';

// GET /api/admin/staff/[id] - Get staff
async function getStaff(req, res) {
  try {
    const { id } = req.query;
    const staff = await getStaffById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: staff._id.toString(),
        storeId: staff.storeId.toString(),
        name: staff.name,
        phone: staff.phone || null,
        role: staff.role,
        status: staff.status
      }
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return handleError(error, res);
  }
}

// PUT /api/admin/staff/[id] - Update staff
async function updateStaffHandler(req, res) {
  try {
    await authorize(req, ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER']);
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
    });
  }

  try {
    const { id } = req.query;
    const { name, phone, role, status } = req.body;

    const staff = await getStaffById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff not found' }
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) {
      const validRoles = ['STORE_MANAGER', 'NC', 'JR', 'OPTOMETRIST', 'SALES'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` }
        });
      }
      updateData.role = role;
    }
    if (status !== undefined) updateData.status = status;

    const updated = await updateStaff(id, updateData);

    return res.status(200).json({
      success: true,
      data: {
        id: updated._id.toString(),
        storeId: updated.storeId.toString(),
        name: updated.name,
        phone: updated.phone || null,
        role: updated.role,
        status: updated.status
      }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return handleError(error, res);
  }
}

// DELETE /api/admin/staff/[id] - Delete staff
async function deleteStaffHandler(req, res) {
  try {
    await authorize(req, ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER']);
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
    });
  }

  try {
    const { id } = req.query;
    const staff = await getStaffById(id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff not found' }
      });
    }

    await deleteStaff(id);

    return res.status(200).json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return getStaff(req, res);
  } else if (req.method === 'PUT') {
    return updateStaffHandler(req, res);
  } else if (req.method === 'DELETE') {
    return deleteStaffHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default withAuth(handler);

