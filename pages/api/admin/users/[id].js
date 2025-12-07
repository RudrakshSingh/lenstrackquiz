// pages/api/admin/users/[id].js
// Get, update, delete specific user

import { withAuth, authorize } from '../../../../middleware/auth';
import { UpdateUserSchema } from '../../../../lib/validation';
import { getUserById, updateUser, deleteUser } from '../../../../models/User';
import { hashPassword } from '../../../../lib/auth';
import { handleError, NotFoundError } from '../../../../lib/errors';

// GET /api/admin/users/[id]
async function getUser(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;

    const targetUser = await getUserById(id);
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check access
    if (targetUser.organizationId.toString() !== user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    // Role-based access
    if (user.role === 'STORE_MANAGER' && targetUser.storeId?.toString() !== user.storeId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: targetUser._id.toString(),
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        storeId: targetUser.storeId ? targetUser.storeId.toString() : null,
        employeeId: targetUser.employeeId,
        phone: targetUser.phone,
        isActive: targetUser.isActive,
        lastLoginAt: targetUser.lastLoginAt,
        createdAt: targetUser.createdAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/users/[id]
async function updateUserHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;

    const targetUser = await getUserById(id);
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Cannot delete self
    if (targetUser._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot update your own account this way' }
      });
    }

    // Check permissions
    if (user.role === 'STORE_MANAGER') {
      if (targetUser.storeId?.toString() !== user.storeId?.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
      // Cannot change role to non-SALES_EXECUTIVE
      if (req.body.role && req.body.role !== 'SALES_EXECUTIVE') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot change role' }
        });
      }
    } else if (user.role === 'ADMIN') {
      if (req.body.role === 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot set super admin role' }
        });
      }
    }

    // Validate input
    const validationResult = UpdateUserSchema.safeParse(req.body);
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

    const updateData = { ...validationResult.data };

    // Hash password if provided
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password;
    }

    const updated = await updateUser(id, updateData);

    return res.status(200).json({
      success: true,
      data: {
        id: updated._id.toString(),
        email: updated.email,
        name: updated.name,
        role: updated.role,
        storeId: updated.storeId ? updated.storeId.toString() : null,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/admin/users/[id]
async function deleteUserHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;

    const targetUser = await getUserById(id);
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Cannot delete self
    if (targetUser._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot delete yourself' }
      });
    }

    // Check permissions
    if (user.role === 'STORE_MANAGER') {
      if (targetUser.storeId?.toString() !== user.storeId?.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
    } else if (user.role === 'ADMIN') {
      authorize('ADMIN')(user);
    } else {
      authorize('SUPER_ADMIN')(user);
    }

    // Soft delete
    await updateUser(id, { isActive: false });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    return getUser(req, res);
  }
  if (req.method === 'PUT') {
    return updateUserHandler(req, res);
  }
  if (req.method === 'DELETE') {
    return deleteUserHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER');

