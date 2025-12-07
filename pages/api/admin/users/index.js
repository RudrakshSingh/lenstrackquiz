// pages/api/admin/users/index.js
// User management endpoints

import { withAuth, authorize } from '../../../../middleware/auth';
import { CreateUserSchema } from '../../../../lib/validation';
import { createUser, getAllUsers, getUserByEmail } from '../../../../models/User';
import { hashPassword } from '../../../../lib/auth';
import { handleError, ConflictError } from '../../../../lib/errors';

// GET /api/admin/users
async function listUsers(req, res) {
  try {
    const { search, storeId, role, isActive, page = 1, limit = 20 } = req.query;
    // Allow public access - user may be undefined for customer UI
    const user = req.user || {};

    // Build filter - only filter by organization if user is authenticated
    const filter = {};
    if (user.organizationId) {
      filter.organizationId = user.organizationId;
    }

    // Role-based filtering (only if user is authenticated)
    if (user.role === 'STORE_MANAGER' && user.storeId) {
      filter.storeId = user.storeId;
    } else if (user.role === 'SALES_EXECUTIVE' && user._id) {
      // Sales exec can only see themselves
      filter._id = user._id;
    }

    if (storeId) filter.storeId = storeId;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await getAllUsers(filter);

    return res.status(200).json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u._id.toString(),
          email: u.email,
          name: u.name,
          role: u.role,
          storeId: u.storeId ? u.storeId.toString() : null,
          employeeId: u.employeeId,
          phone: u.phone,
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length
        }
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/admin/users
async function createUserHandler(req, res) {
  try {
    const user = req.user;
    
    // Check permissions
    if (user.role === 'STORE_MANAGER') {
      authorize('STORE_MANAGER')(user);
      // Store managers can only create SALES_EXECUTIVE
      if (req.body.role !== 'SALES_EXECUTIVE') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Store managers can only create sales executives' }
        });
      }
      // Must be in their store
      if (!req.body.storeId || req.body.storeId !== user.storeId.toString()) {
        req.body.storeId = user.storeId.toString();
      }
    } else if (user.role === 'ADMIN') {
      authorize('ADMIN')(user);
      // Admin cannot create SUPER_ADMIN
      if (req.body.role === 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot create super admin' }
        });
      }
    } else {
      authorize('SUPER_ADMIN')(user);
    }

    // Validate input
    const validationResult = CreateUserSchema.safeParse(req.body);
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

    // Check if email already exists
    const existing = await getUserByEmail(user.organizationId, validationResult.data.email);
    if (existing) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(validationResult.data.password);

    // Create user
    const newUser = await createUser({
      ...validationResult.data,
      passwordHash,
      organizationId: user.organizationId,
      password: undefined // Remove plain password
    });

    return res.status(201).json({
      success: true,
      data: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        storeId: newUser.storeId ? newUser.storeId.toString() : null,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    return listUsers(req, res);
  }
  if (req.method === 'POST') {
    return createUserHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

