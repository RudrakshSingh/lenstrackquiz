// pages/api/auth/login.js
// Authentication login endpoint

import { LoginSchema } from '../../../lib/validation';
import { verifyPassword, generateToken, generateRefreshToken } from '../../../lib/auth';
import { createRefreshToken, revokeAllUserTokens } from '../../../models/RefreshToken';
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

    // Generate tokens - handle null organizationId
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
    
    // Generate access token (short-lived)
    const accessToken = generateToken(tokenPayload);
    
    // Generate refresh token (long-lived)
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });
    
    // Store refresh token in database
    try {
      // Revoke old tokens (optional: keep last N tokens)
      await revokeAllUserTokens(user._id);
      
      // Create new refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await createRefreshToken({
        token: refreshToken,
        userId: user._id,
        expiresAt
      });
    } catch (tokenError) {
      console.warn('Failed to store refresh token:', tokenError);
      // Continue anyway - refresh token will still work but won't be revocable
    }

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
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
      stack: error.stack,
      envCheck: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
    // Ensure we haven't already sent a response
    if (res.headersSent) {
      console.error('Response already sent, cannot send error response');
      return;
    }
    
    // Check for missing environment variables
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'MONGODB_URI is not configured. Please add it to Vercel environment variables.',
          hint: 'Go to Vercel Dashboard → Settings → Environment Variables → Add MONGODB_URI'
        }
      });
    }
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'JWT_SECRET is not configured. Please add it to Vercel environment variables.',
          hint: 'Go to Vercel Dashboard → Settings → Environment Variables → Add JWT_SECRET'
        }
      });
    }
    
    // Check for MongoDB connection errors
    if (error.message && (error.message.includes('MongoDB') || error.message.includes('connection') || error.message.includes('MONGODB_URI') || error.message.includes('queryTxt') || error.message.includes('ENOTFOUND') || error.message.includes('EREFUSED') || error.message.includes('not configured'))) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection error. Please check MongoDB configuration.',
          hint: 'Verify MONGODB_URI is correct and MongoDB Atlas IP whitelist includes 0.0.0.0/0'
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
          message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error. Check Vercel function logs for details.'
        }
      });
    }
  }
}
