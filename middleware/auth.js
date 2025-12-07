// middleware/auth.js
// Authentication and authorization middleware

import { extractToken, verifyToken } from '../lib/auth';
import { getUserById } from '../models/User';

/**
 * Authenticate request - verifies JWT token
 */
export async function authenticate(req) {
  const token = extractToken(req);
  
  if (!token) {
    throw new AuthError('No token provided');
  }

  try {
    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    throw new AuthError('Invalid or expired token');
  }
}

/**
 * Get authenticated user from database
 */
export async function getAuthenticatedUser(req) {
  try {
    const payload = await authenticate(req);
    const user = await getUserById(payload.userId);
    
    if (!user || !user.isActive) {
      throw new AuthError('User not found or inactive');
    }
    
    return user;
  } catch (error) {
    // If it's already an AuthError, re-throw it
    if (error instanceof AuthError) {
      throw error;
    }
    // If it's a database/MongoDB error, wrap it
    if (error.message && (error.message.includes('MongoDB') || error.message.includes('connection') || error.message.includes('MONGODB_URI'))) {
      console.error('Database error in getAuthenticatedUser:', error);
      throw new Error('Database connection error. Please check MongoDB configuration.');
    }
    // Otherwise, wrap as AuthError
    throw new AuthError('Authentication failed: ' + error.message);
  }
}

/**
 * Authorize user - check if user has required role
 */
export function authorize(...allowedRoles) {
  return (user) => {
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}

/**
 * Check if user can access resource
 */
export function canAccessResource(user, resource, action) {
  // Super Admin can do everything
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Admin can do most things except create Super Admin
  if (user.role === 'ADMIN') {
    if (resource === 'user' && action === 'create' && resource.role === 'SUPER_ADMIN') {
      return false;
    }
    return true;
  }

  // Store Manager can only manage their store
  if (user.role === 'STORE_MANAGER') {
    if (resource === 'store' && resource.storeId !== user.storeId) {
      return false;
    }
    if (resource === 'user' && action === 'create' && resource.role !== 'SALES_EXECUTIVE') {
      return false;
    }
    return true;
  }

  // Sales Executive has limited access
  if (user.role === 'SALES_EXECUTIVE') {
    if (['create', 'update', 'delete'].includes(action)) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Custom error classes
 */
export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
    this.code = 'AUTH_ERROR';
  }
}

export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.code = 'FORBIDDEN';
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withAuth(handler, ...allowedRoles) {
  return async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      if (allowedRoles.length > 0) {
        authorize(...allowedRoles)(user);
      }
      
      // Attach user to request
      req.user = user;
      
      return handler(req, res);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(401).json({
          success: false,
          error: {
            code: error.code || 'AUTH_ERROR',
            message: error.message
          }
        });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          success: false,
          error: {
            code: error.code || 'FORBIDDEN',
            message: error.message
          }
        });
      }
      // Handle any other errors (like MongoDB connection errors)
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }
      });
    }
  };
}
