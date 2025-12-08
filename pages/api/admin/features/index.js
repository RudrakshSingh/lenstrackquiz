// pages/api/admin/features/index.js
// Feature management endpoints

import { withAuth, authorize } from '../../../../middleware/auth';
import { createFeature, getAllFeatures, getFeatureByKey } from '../../../../models/Feature';
import { handleError, ConflictError, ValidationError } from '../../../../lib/errors';
import { z } from 'zod';

const CreateFeatureSchema = z.object({
  code: z.string().min(1, 'Feature code is required').optional(),
  key: z.string().min(1, 'Feature key is required').optional(), // For backward compatibility
  name: z.string().min(1, 'Feature name is required'),
  description: z.string().optional(),
  category: z.enum(['DURABILITY', 'COATING', 'PROTECTION', 'LIFESTYLE', 'VISION']).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional()
}).refine((data) => data.code || data.key, {
  message: 'Either code or key is required',
  path: ['code']
});

// GET /api/admin/features
async function listFeatures(req, res) {
  try {
    const { isActive } = req.query;
    const user = req.user;

    // Features are lens-only, no product-type filtering
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const features = await getAllFeatures(filter);

    // Get product counts for each feature
    const { getProductFeatureCollection } = await import('../../../../models/ProductFeature');
    const productFeatureCollection = await getProductFeatureCollection();
    
    const featuresWithCounts = await Promise.all(
      features.map(async (f) => {
        const productCount = await productFeatureCollection.countDocuments({ featureId: f._id });
        
        return {
          id: f._id.toString(),
          code: f.code,
          key: f.code, // For backward compatibility
          name: f.name,
          description: f.description || null,
          category: f.category,
          displayOrder: f.displayOrder || 0,
          isActive: f.isActive !== false,
          productCount,
          createdAt: f.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        features: featuresWithCounts
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

    // Map key to code for backward compatibility
    const featureData = {
      ...validationResult.data,
      code: validationResult.data.code || validationResult.data.key,
      name: validationResult.data.name,
      description: validationResult.data.description || null,
      category: validationResult.data.category || 'LIFESTYLE',
      displayOrder: validationResult.data.displayOrder || 0,
      isActive: validationResult.data.isActive !== undefined ? validationResult.data.isActive : true
    };
    // Remove key if present to avoid confusion
    delete featureData.key;

    // Check if feature code already exists (globally, not per organization)
    const { getFeatureByCode } = await import('../../../../models/Feature');
    const existing = await getFeatureByCode(featureData.code);
    if (existing) {
      throw new ConflictError('Feature code already exists');
    }

    const feature = await createFeature(featureData);

    return res.status(201).json({
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

