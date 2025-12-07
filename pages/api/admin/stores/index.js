// pages/api/admin/stores/index.js
// Store management endpoints

import { withAuth, authorize } from '../../../../middleware/auth';
import { CreateStoreSchema, UpdateStoreSchema } from '../../../../lib/validation';
import { createStore, getAllStores, getStoreById } from '../../../../models/Store';
import { handleError } from '../../../../lib/errors';

// GET /api/admin/stores - List stores
async function listStores(req, res) {
  try {
    const { search, page = 1, limit = 20, isActive } = req.query;
    // Allow public access - user may be undefined for customer UI
    const user = req.user || {};

    // Build filter - only filter by organization if user is authenticated
    const filter = {};
    if (user.organizationId) {
      filter.organizationId = user.organizationId;
    }
    
    // Filter by store if user is not admin (only if authenticated)
    if (user.role && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.storeId) {
      filter._id = user.storeId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const stores = await getAllStores(filter);
    
    // Get staff count for each store (simplified - would need aggregation in production)
    const storesWithCounts = await Promise.all(stores.map(async (store) => {
      const { getAllUsers } = await import('../../../../models/User');
      const staff = await getAllUsers({ storeId: store._id, isActive: true });
      return {
        id: store._id.toString(),
        code: store.code,
        name: store.name,
        city: store.city,
        isActive: store.isActive,
        staffCount: staff.length,
        createdAt: store.createdAt
      };
    }));

    return res.status(200).json({
      success: true,
      data: {
        stores: storesWithCounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: storesWithCounts.length
        }
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/admin/stores - Create store
async function createStoreHandler(req, res) {
  try {
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

    // Validate organizationId
    if (!user.organizationId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'User organization ID is required' }
      });
    }

    // Clean up empty strings to null for optional fields
    const cleanedData = {};
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      if (value === '') {
        cleanedData[key] = null;
      } else if (value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    });

    // Validate input
    const validationResult = CreateStoreSchema.safeParse(cleanedData);
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

    // Check if store code already exists
    const { getStoreByCode } = await import('../../../../models/Store');
    const existing = await getStoreByCode(user.organizationId, validationResult.data.code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Store code already exists' }
      });
    }

    const store = await createStore({
      ...validationResult.data,
      organizationId: user.organizationId
    });

    if (!store || !store._id) {
      throw new Error('Failed to create store');
    }

    return res.status(201).json({
      success: true,
      data: {
        id: store._id.toString(),
        code: store.code,
        name: store.name,
        address: store.address || null,
        city: store.city || null,
        state: store.state || null,
        pincode: store.pincode || null,
        phone: store.phone || null,
        email: store.email || null,
        gstNumber: store.gstNumber || null,
        isActive: store.isActive !== false,
        organizationId: store.organizationId ? store.organizationId.toString() : null,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      }
    });
  } catch (error) {
    console.error('Create store error:', error);
    return handleError(error, res);
  }
}

// Allow public GET access for customer UI, but require auth for POST
async function handler(req, res) {
  if (req.method === 'GET') {
    // Public access for GET - no auth required (for customer UI)
    return listStores(req, res);
  }
  if (req.method === 'POST') {
    // Require auth for POST
    return withAuth(createStoreHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

