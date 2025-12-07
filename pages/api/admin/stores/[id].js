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

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Store ID is required' }
      });
    }

    const store = await getStoreById(id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check access (only if user has organizationId)
    if (user && user.organizationId && store.organizationId) {
      if (store.organizationId.toString() !== user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
    }

    // Get staff list
    const staff = await getAllUsers({ storeId: store._id, isActive: true });

    return res.status(200).json({
      success: true,
      data: {
        ...store,
        id: store._id.toString(),
        _id: undefined,
        status: store.status || (store.isActive ? 'ACTIVE' : 'INACTIVE'), // V1.0 Spec
        qrCodeUrl: store.qrCodeUrl || null, // V1.0 Spec: QR code URL
        organizationId: store.organizationId ? store.organizationId.toString() : null,
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
    console.error('Get store error:', error);
    return handleError(error, res);
  }
}

// PUT /api/admin/stores/[id]
async function updateStoreHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;
    
    // Check authorization
    try {
      authorize('SUPER_ADMIN', 'ADMIN')(user);
    } catch (authError) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: authError.message || 'Insufficient permissions' }
      });
    }

    const store = await getStoreById(id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check organization access
    if (store.organizationId && user.organizationId && 
        store.organizationId.toString() !== user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this store' }
      });
    }

    // Clean up empty strings to null for optional fields
    const cleanedData = {};
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      // Convert empty strings to null for optional fields
      if (value === '') {
        cleanedData[key] = null;
      } else if (value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    });

    // Remove fields that shouldn't be updated
    delete cleanedData.organizationId;
    delete cleanedData._id;
    delete cleanedData.id;
    delete cleanedData.createdAt;

    // Validate input
    const validationResult = UpdateStoreSchema.safeParse(cleanedData);
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

    // Use validated data (organizationId already removed)
    const updateData = validationResult.data;
    
    const updated = await updateStore(id, updateData);
    
    if (!updated) {
      throw new NotFoundError('Store not found or update failed');
    }

    // Fetch the updated store to ensure we have all fields
    const refreshedStore = await getStoreById(id);
    if (!refreshedStore) {
      throw new NotFoundError('Store not found after update');
    }

    return res.status(200).json({
      success: true,
      data: {
        id: refreshedStore._id.toString(),
        code: refreshedStore.code,
        name: refreshedStore.name,
        address: refreshedStore.address || null,
        city: refreshedStore.city || null,
        state: refreshedStore.state || null,
        pincode: refreshedStore.pincode || null,
        phone: refreshedStore.phone || null,
        email: refreshedStore.email || null,
        gstNumber: refreshedStore.gstNumber || null,
        isActive: refreshedStore.isActive !== false,
        status: refreshedStore.status || (refreshedStore.isActive ? 'ACTIVE' : 'INACTIVE'),
        qrCodeUrl: refreshedStore.qrCodeUrl || null, // V1.0 Spec: QR code URL
        organizationId: refreshedStore.organizationId ? refreshedStore.organizationId.toString() : null,
        createdAt: refreshedStore.createdAt,
        updatedAt: refreshedStore.updatedAt
      }
    });
  } catch (error) {
    console.error('Update store error:', error);
    return handleError(error, res);
  }
}

// DELETE /api/admin/stores/[id]
async function deleteStoreHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;
    
    // Check authorization
    try {
      authorize('SUPER_ADMIN', 'ADMIN')(user);
    } catch (authError) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: authError.message || 'Insufficient permissions' }
      });
    }

    const store = await getStoreById(id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check organization access
    if (store.organizationId && user.organizationId && 
        store.organizationId.toString() !== user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this store' }
      });
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
    const updated = await updateStore(id, { isActive: false });
    
    if (!updated) {
      throw new NotFoundError('Store not found or delete failed');
    }

    return res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Delete store error:', error);
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

