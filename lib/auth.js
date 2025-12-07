// lib/auth.js
// Authentication utilities

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

// Validate JWT_SECRET in production
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ JWT_SECRET is not set! Authentication will fail.');
  console.error('Please add JWT_SECRET to your Vercel environment variables.');
}

/**
 * Hash a password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please add it to environment variables.');
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please add it to environment variables.');
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from request headers
 */
export function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
