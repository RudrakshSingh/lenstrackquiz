// pages/api/admin/features/[id].js
// Get, update, delete specific feature

import { withAuth, authorize } from '../../../../middleware/auth';
import { getFeatureById, updateFeature, deleteFeature } from '../../../../models/Feature';
import { handleError, NotFoundError, ValidationError } from '../../../../lib/errors';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const UpdateFeatureSchema = z.object({
  code: z.string().min(1, 'Feature code is required').optional(),
  key: z.string().min(1, 'Feature key is required').optional(), // For backward compatibility
  name: z.string().min(1, 'Feature name is required').optional(),
  description: z.string().optional(),
  category: z.enum(['EYEGLASSES', 'SUNGLASSES', 'CONTACT_LENSES', 'ACCESSORIES']).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/features/[id]
async function getFeature(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Feature ID is required' }
      });
    }

    const feature = await getFeatureById(id);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Check access
    if (user && user.organizationId && feature.organizationId) {
      if (feature.organizationId.toString() !== user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: feature._id.toString(),
        code: feature.code,
        key: feature.code, // For backward compatibility
        name: feature.name,
        description: feature.description,
        category: feature.category,
        isActive: feature.isActive !== false,
        createdAt: feature.createdAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/features/[id]
async function updateFeatureHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;
    authorize('SUPER_ADMIN', 'ADMIN')(user);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Feature ID is required' }
      });
    }

    const feature = await getFeatureById(id);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Check access
    if (user.organizationId && feature.organizationId) {
      if (feature.organizationId.toString() !== user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
    }

    // Validate input
    const validationResult = UpdateFeatureSchema.safeParse(req.body);
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

    // Map key to code for backward compatibility
    const updateData = {
      ...validationResult.data,
      code: validationResult.data.code || validationResult.data.key || feature.code,
      name: validationResult.data.name !== undefined ? validationResult.data.name : feature.name,
      description: validationResult.data.description !== undefined ? validationResult.data.description : feature.description,
      category: validationResult.data.category || feature.category,
      isActive: validationResult.data.isActive !== undefined ? validationResult.data.isActive : feature.isActive
    };
    // Remove key if present to avoid confusion
    if (updateData.key) delete updateData.key;

    const updatedFeature = await updateFeature(id, updateData);

    return res.status(200).json({
      success: true,
      data: {
        id: updatedFeature._id.toString(),
        code: updatedFeature.code,
        key: updatedFeature.code, // For backward compatibility
        name: updatedFeature.name,
        description: updatedFeature.description,
        category: updatedFeature.category,
        isActive: updatedFeature.isActive !== false,
        createdAt: updatedFeature.createdAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/admin/features/[id]
async function deleteFeatureHandler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;
    authorize('SUPER_ADMIN', 'ADMIN')(user);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Feature ID is required' }
      });
    }

    const feature = await getFeatureById(id);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Check access
    if (user.organizationId && feature.organizationId) {
      if (feature.organizationId.toString() !== user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
    }

    // Soft delete (set isActive to false)
    await updateFeature(id, { isActive: false });

    return res.status(200).json({
      success: true,
      message: 'Feature deactivated successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    return getFeature(req, res);
  }
  if (req.method === 'PUT') {
    return updateFeatureHandler(req, res);
  }
  if (req.method === 'DELETE') {
    return deleteFeatureHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}, 'SUPER_ADMIN', 'ADMIN');

