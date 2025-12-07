// pages/api/admin/stores/[id].js
// Get, update, delete specific store

import { withAuth, authorize } from '../../../../middleware/auth';
import { UpdateStoreSchema } from '../../../../lib/validation';
import { getStoreById, updateStore, deleteStore } from '../../../../models/Store';
import { getAllUsers } from '../../../../models/User';
import { getAllSessions } from '../../../../models/Session';
import { handleError, NotFoundError } from '../../../../lib/errors';
import { ObjectId } from 'mongodb';

// GET /api/admin/stores/[id]
async function getStore(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;

    const store = await getStoreById(id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check access
    if (store.organizationId.toString() !== user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    // Get staff list
    const staff = await getAllUsers({ storeId: store._id, isActive: true });

    return res.status(200).json({
      success: true,
      data: {
        ...store,
        id: store._id.toString(),
        _id: undefined,
        organizationId: store.organizationId.toString(),
        staff: staff.map(u => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          employeeId: u.employeeId
        }))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/stores/[id]
async function updateStoreHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;
    
    authorize('SUPER_ADMIN', 'ADMIN')(user);

    const store = await getStoreById(id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Validate input
    const validationResult = UpdateStoreSchema.safeParse(req.body);
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

    const updated = await updateStore(id, validationResult.data);

    return res.status(200).json({
      success: true,
      data: {
        ...updated,
        id: updated._id.toString(),
        _id: undefined,
        organizationId: updated.organizationId.toString()
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/admin/stores/[id]
async function deleteStoreHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;
    
    authorize('SUPER_ADMIN', 'ADMIN')(user);

    const store = await getStoreById(id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check for active sessions
    const activeSessions = await getAllSessions({ 
      storeId: store._id,
      status: { $in: ['IN_PROGRESS', 'COMPLETED'] }
    });

    if (activeSessions.length > 0) {
      return res.status(409).json({
        success: false,
        error: { 
          code: 'RESOURCE_CONFLICT', 
          message: 'Cannot delete store with active sessions' 
        }
      });
    }

    // Soft delete
    await updateStore(id, { isActive: false });

    return res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    return getStore(req, res);
  }
  if (req.method === 'PUT') {
    return updateStoreHandler(req, res);
  }
  if (req.method === 'DELETE') {
    return deleteStoreHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

