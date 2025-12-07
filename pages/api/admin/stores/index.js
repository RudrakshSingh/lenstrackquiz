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
    // For SUPER_ADMIN and ADMIN, show all stores (no organizationId filter)
    // For other roles, filter by organizationId
    if (user.organizationId && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      filter.organizationId = user.organizationId;
    }
    
    // Filter by store if user is not admin (only if authenticated)
    if (user.role && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.storeId) {
      filter._id = user.storeId;
    }
    
    console.log('User info:', { 
      hasOrgId: !!user.organizationId, 
      organizationId: user.organizationId?.toString(), 
      role: user.role 
    });

    // Search filter (apply first)
    const searchFilter = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ]
    } : null;

    // Handle isActive filter from query params
    if (isActive !== undefined) {
      // Explicit filter from query params
      if (isActive === 'true' || isActive === true) {
        filter.isActive = true;
      } else if (isActive === 'false' || isActive === false) {
        filter.isActive = false;
      }
    } else {
      // Default: exclude deleted stores (isActive: false)
      // Include stores where isActive is true, undefined, or null
      // This excludes soft-deleted stores but includes new stores
      // Use $ne: false to include stores with isActive: true, undefined, or null
      // This will exclude stores that are explicitly set to isActive: false (deleted)
      filter.isActive = { $ne: false };
    }

    // Apply search filter if exists
    if (searchFilter) {
      // If we already have isActive filter, combine with $and
      if (filter.isActive) {
        filter.$and = [
          searchFilter,
          { isActive: filter.isActive }
        ];
        delete filter.isActive; // Remove direct isActive, it's now in $and
      } else {
        Object.assign(filter, searchFilter);
      }
    }
    
    console.log('Store list filter:', JSON.stringify(filter, null, 2));
    const stores = await getAllStores(filter);
    console.log('Stores found:', stores.length);
    if (stores.length > 0) {
      console.log('Store details:', stores.map(s => ({ 
        id: s._id?.toString(), 
        code: s.code, 
        name: s.name, 
        isActive: s.isActive,
        organizationId: s.organizationId?.toString()
      })));
    } else {
      // Debug: Try to find stores without any filter to see what's in DB
      const allStores = await getAllStores({});
      console.log('DEBUG: Total stores in DB (no filter):', allStores.length);
      if (allStores.length > 0) {
        console.log('DEBUG: All stores in DB:', allStores.map(s => ({ 
          id: s._id?.toString(), 
          code: s.code, 
          name: s.name, 
          isActive: s.isActive,
          organizationId: s.organizationId?.toString()
        })));
      }
    }
    
    // Get staff count for each store (simplified - would need aggregation in production)
    const storesWithCounts = await Promise.all(stores.map(async (store) => {
      const { getAllUsers } = await import('../../../../models/User');
      const staff = await getAllUsers({ storeId: store._id, isActive: true });
      return {
        id: store._id.toString(),
        code: store.code,
        name: store.name,
        city: store.city || null,
        address: store.address || null,
        state: store.state || null,
        pincode: store.pincode || null,
        phone: store.phone || null,
        email: store.email || null,
        gstNumber: store.gstNumber || null,
        isActive: store.isActive !== false,
        status: store.status || (store.isActive ? 'ACTIVE' : 'INACTIVE'),
        qrCodeUrl: store.qrCodeUrl || null, // V1.0 Spec: QR code URL
        staffCount: staff.length,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
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
      console.error('Authorization error:', authError);
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: authError.message || 'Insufficient permissions' }
      });
    }

    // Validate organizationId
    if (!user.organizationId) {
      console.error('Missing organizationId for user:', user);
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
        // Normalize code: trim whitespace
        if (key === 'code' && typeof value === 'string') {
          cleanedData[key] = value.trim();
        } else {
          cleanedData[key] = value;
        }
      }
    });

    // Validate input
    const validationResult = CreateStoreSchema.safeParse(cleanedData);
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

    // Check if store code already exists (only active stores)
    try {
      const { getStoreByCode } = await import('../../../../models/Store');
      const existing = await getStoreByCode(user.organizationId, validationResult.data.code, false);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { 
            code: 'RESOURCE_CONFLICT', 
            message: `Store code "${validationResult.data.code}" already exists in your organization. Please use a different code.`
          }
        });
      }
    } catch (checkError) {
      console.error('Error checking existing store:', checkError);
      // Continue with creation if check fails (might be connection issue)
      // But log it for debugging
    }

    // V1.0 Spec: Generate QR code URL with storeId embedded
    // We'll generate it after store creation since we need the store ID
    let store;
    try {
      // Ensure isActive defaults to true if not explicitly set
      const storeData = {
        ...validationResult.data,
        organizationId: user.organizationId,
        isActive: validationResult.data.isActive !== undefined ? validationResult.data.isActive : true
      };
      store = await createStore(storeData);
      
      // Generate QR code URL after store creation
      if (store && store._id) {
        try {
          const { generateStoreQRCode } = await import('../../../../lib/qrCode');
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (req.headers.origin || '');
          const qrCodeUrl = generateStoreQRCode(store._id.toString(), baseUrl);
          
          // Update store with QR code URL (non-blocking - if it fails, we still return the store)
          const { updateStore } = await import('../../../../models/Store');
          const updatedStore = await updateStore(store._id, { qrCodeUrl });
          
          // Only update store variable if update was successful, otherwise keep original
          if (updatedStore && updatedStore._id) {
            store = updatedStore;
          } else {
            // Update failed, but we still have the original store - just log it
            console.warn('QR code URL update failed, but store was created successfully:', store._id.toString());
            // Manually add qrCodeUrl to the store object for response
            store.qrCodeUrl = qrCodeUrl;
          }
        } catch (qrError) {
          // QR code generation/update failed, but store was created - log and continue
          console.error('Error generating/updating QR code URL:', qrError);
          // Store creation was successful, so we continue with the original store object
        }
      }
    } catch (createError) {
      console.error('Error in createStore function:', createError);
      console.error('CreateStore error details:', {
        message: createError.message,
        stack: createError.stack,
        code: createError.code,
        name: createError.name
      });
      throw createError;
    }

    // Validate store was created successfully
    if (!store) {
      console.error('Store creation returned null/undefined');
      return res.status(500).json({
        success: false,
        error: { code: 'STORE_CREATION_FAILED', message: 'Failed to create store - store object is null' }
      });
    }
    
    if (!store._id) {
      console.error('Store creation returned store without _id:', JSON.stringify(store, null, 2));
      return res.status(500).json({
        success: false,
        error: { code: 'STORE_CREATION_FAILED', message: 'Failed to create store - no ID returned from database' }
      });
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
        status: store.status || (store.isActive ? 'ACTIVE' : 'INACTIVE'),
        qrCodeUrl: store.qrCodeUrl || null, // V1.0 Spec: QR code URL
        organizationId: store.organizationId ? store.organizationId.toString() : null,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      }
    });
  } catch (error) {
    console.error('Create store error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      envCheck: {
        hasMongoUri: !!process.env.MONGODB_URI,
        nodeEnv: process.env.NODE_ENV
      }
    });
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

