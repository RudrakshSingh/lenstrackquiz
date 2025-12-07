// models/RefreshToken.js
// MongoDB model for Refresh Tokens

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export async function getRefreshTokenCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('refreshTokens');
}

/**
 * Create a refresh token record
 */
export async function createRefreshToken(tokenData) {
  const collection = await getRefreshTokenCollection();
  const now = new Date();
  const refreshToken = {
    token: tokenData.token,
    userId: typeof tokenData.userId === 'string' ? new ObjectId(tokenData.userId) : tokenData.userId,
    expiresAt: tokenData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
    isRevoked: false,
    createdAt: now,
    lastUsedAt: null
  };
  const result = await collection.insertOne(refreshToken);
  return { ...refreshToken, _id: result.insertedId };
}

/**
 * Get refresh token by token string
 */
export async function getRefreshTokenByToken(token) {
  const collection = await getRefreshTokenCollection();
  return await collection.findOne({ 
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() } // Not expired
  });
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(token) {
  const collection = await getRefreshTokenCollection();
  return await collection.updateOne(
    { token },
    { 
      $set: { 
        isRevoked: true,
        revokedAt: new Date()
      } 
    }
  );
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId) {
  const collection = await getRefreshTokenCollection();
  const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  return await collection.updateMany(
    { userId: objectId, isRevoked: false },
    { 
      $set: { 
        isRevoked: true,
        revokedAt: new Date()
      } 
    }
  );
}

/**
 * Update last used timestamp
 */
export async function updateTokenLastUsed(token) {
  const collection = await getRefreshTokenCollection();
  return await collection.updateOne(
    { token },
    { $set: { lastUsedAt: new Date() } }
  );
}

/**
 * Clean up expired tokens (can be run as a cron job)
 */
export async function cleanupExpiredTokens() {
  const collection = await getRefreshTokenCollection();
  return await collection.deleteMany({
    expiresAt: { $lt: new Date() }
  });
}

