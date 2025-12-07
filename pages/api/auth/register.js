// pages/api/auth/register.js
// Registration endpoint for creating organization and super admin

import { CreateUserSchema } from '../../../lib/validation';
import { hashPassword, generateToken } from '../../../lib/auth';
import { createOrganization } from '../../../models/Organization';
import { createUser } from '../../../models/User';
import { handleError, ConflictError } from '../../../lib/errors';

export default async function handler(req, res) {
  // Ensure we always return JSON, never HTML
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const { email, password, name, organizationName, phone } = req.body;

    // Validate input
    if (!email || !password || !name || !organizationName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: email, password, name, organizationName'
        }
      });
    }

    // Check if user already exists (search across all organizations)
    const { getAllUsers } = await import('../../../models/User');
    let existingUsers = [];
    try {
      existingUsers = await getAllUsers({ email });
    } catch (dbError) {
      console.error('Error checking for existing user:', dbError);
      // Continue with registration if check fails (non-critical)
    }
    if (existingUsers && existingUsers.length > 0) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization
    const organization = await createOrganization({
      name: organizationName,
      isActive: true
    });

    // Create super admin user
    const user = await createUser({
      email,
      password: passwordHash, // Store as 'password' field, not 'passwordHash'
      name,
      phone: phone || null,
      role: 'SUPER_ADMIN',
      organizationId: organization._id,
      isActive: true
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
      storeId: null
    });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: organization._id.toString(),
          organizationName: organization.name
        }
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

