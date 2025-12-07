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

    // Validate ObjectId format
    let objectId;
    try {
      objectId = typeof id === 'string' ? new ObjectId(id) : id;
    } catch (error) {
      console.error('Invalid ObjectId format in update:', id, error);
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid store ID format: ${id}` }
      });
    }

    const store = await getStoreById(id);
    if (!store) {
      console.error('Store not found for update:', id);
      throw new NotFoundError('Store not found');
    }

    console.log('Updating store:', id, 'Current store:', { code: store.code, name: store.name, status: store.status, isActive: store.isActive });

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

    console.log('Cleaned update data:', cleanedData);

    // Remove fields that shouldn't be updated
    delete cleanedData.organizationId;
    delete cleanedData._id;
    delete cleanedData.id;
    delete cleanedData.createdAt;

    // Validate input
    const validationResult = UpdateStoreSchema.safeParse(cleanedData);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
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
    console.log('Validated update data:', updateData);
    
    // If code is being updated, check for duplicates (excluding current store)
    if (updateData.code && updateData.code !== store.code) {
      try {
        const { getStoreByCode } = await import('../../../../models/Store');
        const existing = await getStoreByCode(user.organizationId, updateData.code, false);
        if (existing && existing._id.toString() !== id) {
          return res.status(409).json({
            success: false,
            error: { 
              code: 'RESOURCE_CONFLICT', 
              message: `Store code "${updateData.code}" already exists in your organization. Please use a different code.`
            }
          });
        }
      } catch (checkError) {
        console.error('Error checking existing store code:', checkError);
        // Continue with update if check fails
      }
    }
    
    console.log('Calling updateStore with:', id, updateData);
    const updated = await updateStore(id, updateData);
    console.log('updateStore returned:', updated ? 'Store updated' : 'null/undefined');
    
    if (!updated) {
      console.error('Store update failed - updateStore returned null/undefined for id:', id);
      throw new NotFoundError('Store not found or update failed');
    }

    // Fetch the updated store to ensure we have all fields
    const refreshedStore = await getStoreById(id);
    if (!refreshedStore) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Store not found after update' }
      });
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
    
    // Validate ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Store ID is required' }
      });
    }
    
    // Check authorization
    try {
      authorize('SUPER_ADMIN', 'ADMIN')(user);
    } catch (authError) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: authError.message || 'Insufficient permissions' }
      });
    }

    // Validate ObjectId format
    let objectId;
    try {
      objectId = typeof id === 'string' ? new ObjectId(id) : id;
    } catch (error) {
      console.error('Invalid ObjectId format in delete:', id, error);
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid store ID format: ${id}` }
      });
    }
    
    // Get store - check if it exists
    const store = await getStoreById(id);
    if (!store) {
      console.error('Store not found for deletion:', id);
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Store with ID ${id} not found` }
      });
    }
    
    // Check if already deleted (idempotent operation)
    if (store.isActive === false || store.status === 'INACTIVE') {
      return res.status(200).json({
        success: true,
        message: 'Store is already deleted',
        alreadyDeleted: true
      });
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

    // Soft delete - set both isActive and status to ensure proper filtering
    const updateData = { isActive: false, status: 'INACTIVE' };
    console.log('Deleting store:', id, 'with data:', updateData);
    const updated = await updateStore(id, updateData);
    
    if (!updated) {
      console.error('Store deletion failed - updateStore returned:', updated);
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Store not found or delete failed' }
      });
    }

    console.log('Store deleted successfully:', id, 'Updated store:', updated?._id?.toString());
    return res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Delete store error:', error);
    return handleError(error, res);
  }
}

async function handler(req, res) {
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
}

export default withAuth(handler);

