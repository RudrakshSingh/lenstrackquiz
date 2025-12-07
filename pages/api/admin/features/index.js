// pages/api/admin/features/index.js
// Feature management endpoints

import { withAuth, authorize } from '../../../../middleware/auth';
import { createFeature, getAllFeatures, getFeatureByKey } from '../../../../models/Feature';
import { handleError, ConflictError, ValidationError } from '../../../../lib/errors';
import { z } from 'zod';

const CreateFeatureSchema = z.object({
  key: z.string().min(1, 'Feature key is required'),
  name: z.string().min(1, 'Feature name is required'),
  description: z.string().optional(),
  category: z.enum(['EYEGLASSES', 'SUNGLASSES', 'CONTACT_LENSES', 'ACCESSORIES'])
});

// GET /api/admin/features
async function listFeatures(req, res) {
  try {
    const { category, isActive } = req.query;
    const user = req.user;

    const filter = { organizationId: user.organizationId };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const features = await getAllFeatures(filter);

    return res.status(200).json({
      success: true,
      data: {
        features: features.map(f => ({
          id: f._id.toString(),
          key: f.key,
          name: f.name,
          description: f.description,
          category: f.category,
          isActive: f.isActive,
          createdAt: f.createdAt
        }))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/admin/features
async function createFeatureHandler(req, res) {
  try {
    const user = req.user;
    authorize('SUPER_ADMIN', 'ADMIN')(user);

    // Validate input
    const validationResult = CreateFeatureSchema.safeParse(req.body);
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

    // Check if feature key already exists
    const existing = await getFeatureByKey(
      user.organizationId, 
      validationResult.data.key, 
      validationResult.data.category
    );
    if (existing) {
      throw new ConflictError('Feature key already exists for this category');
    }

    const feature = await createFeature({
      ...validationResult.data,
      organizationId: user.organizationId
    });

    return res.status(201).json({
      success: true,
      data: {
        id: feature._id.toString(),
        key: feature.key,
        name: feature.name,
        description: feature.description,
        category: feature.category,
        isActive: feature.isActive,
        createdAt: feature.createdAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    return listFeatures(req, res);
  }
  if (req.method === 'POST') {
    return createFeatureHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}, 'SUPER_ADMIN', 'ADMIN');

