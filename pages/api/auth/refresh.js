// pages/api/auth/refresh.js
// Refresh token endpoint

import { generateToken, verifyToken } from '../../../lib/auth';
import { getRefreshTokenByToken, revokeRefreshToken, updateTokenLastUsed, createRefreshToken } from '../../../models/RefreshToken';
import { getUserById } from '../../../models/User';
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      });
    }

    // Verify refresh token is valid and not expired
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    // Check if token exists in database and is not revoked
    const tokenRecord = await getRefreshTokenByToken(refreshToken);
    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Refresh token not found or revoked'
        }
      });
    }

    // Get user
    const user = await getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'User not found or inactive'
        }
      });
    }

    // Update token last used timestamp
    await updateTokenLastUsed(refreshToken);

    // Generate new access token
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
    
    const newAccessToken = generateToken(tokenPayload);

    // Optionally: Rotate refresh token (revoke old, create new)
    // For now, we'll keep the same refresh token
    // Uncomment below to enable token rotation:
    /*
    await revokeRefreshToken(refreshToken);
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createRefreshToken({
      token: newRefreshToken,
      userId: user._id,
      expiresAt
    });
    */

    return res.status(200).json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: refreshToken // Return same refresh token (or new one if rotation enabled)
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (res.headersSent) {
      return;
    }
    
    return handleError(error, res);
  }
}

