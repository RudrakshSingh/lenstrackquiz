// pages/api/auth/login.js
// Authentication login endpoint

import { LoginSchema } from '../../../lib/validation';
import { verifyPassword, generateToken } from '../../../lib/auth';
import { handleError } from '../../../lib/errors';

export default async function handler(req, res) {
  // Ensure we always return JSON, never HTML
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    // Validate input
    const validationResult = LoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const details = {};
      validationResult.error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(err.message);
      });
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details
        }
      });
    }

    const { email, password } = validationResult.data;

    // Get user by email (need organizationId - for now, try to find in any org)
    // In production, you might want to pass organizationId in login
    const { getAllUsers } = await import('../../../models/User');
    const allUsers = await getAllUsers({ email, isActive: true });
    
    if (allUsers.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const user = allUsers[0]; // Take first match (in production, handle multi-org better)

    // Check if user has a password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Update last login (don't fail if this errors)
    try {
      const { updateLastLogin } = await import('../../../models/User');
      await updateLastLogin(user._id);
    } catch (updateError) {
      console.warn('Failed to update last login:', updateError);
      // Continue anyway - not critical
    }

    // Get store info if user has storeId
    let storeName = null;
    if (user.storeId) {
      try {
        const { getStoreById } = await import('../../../models/Store');
        const store = await getStoreById(user.storeId);
        storeName = store?.name || null;
      } catch (storeError) {
        console.warn('Failed to get store info:', storeError);
        // Continue anyway - not critical
      }
    }

    // Generate token - handle null organizationId
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };
    
    if (user.organizationId) {
      tokenPayload.organizationId = user.organizationId.toString();
    }
    
    if (user.storeId) {
      tokenPayload.storeId = user.storeId.toString();
    }
    
    const token = generateToken(tokenPayload);

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId ? user.storeId.toString() : null,
          storeName
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Ensure we haven't already sent a response
    if (res.headersSent) {
      console.error('Response already sent, cannot send error response');
      return;
    }
    
    // Check for MongoDB connection errors
    if (error.message && (error.message.includes('MongoDB') || error.message.includes('connection') || error.message.includes('MONGODB_URI') || error.message.includes('queryTxt') || error.message.includes('ENOTFOUND') || error.message.includes('EREFUSED'))) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection error. Please check MongoDB configuration.'
        }
      });
    }
    
    // Use handleError but ensure it returns JSON
    try {
      return handleError(error, res);
    } catch (handleErrorException) {
      // If handleError itself fails, return a basic JSON error
      console.error('handleError failed:', handleErrorException);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }
      });
    }
  }
}
