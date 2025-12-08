// pages/api/admin/benefits/index.js
// Benefits CRUD endpoints

import { withAuth } from '../../../../middleware/auth';
import { createBenefit, getAllBenefits, getBenefitByCode } from '../../../../models/Benefit';
import { handleError } from '../../../../lib/errors';

// POST /api/admin/benefits
async function createBenefitHandler(req, res) {
  try {
    const { code, name, description, pointWeight, maxScore, isActive } = req.body;

    // Validation
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'code and name are required' }
      });
    }

    // Check if code already exists
    const existing = await getBenefitByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Benefit code already exists' }
      });
    }

    const benefit = await createBenefit({
      code,
      name,
      description,
      pointWeight: pointWeight || 1.0,
      maxScore: maxScore !== undefined ? maxScore : 3.0,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      data: {
        id: benefit._id.toString(),
        code: benefit.code,
        name: benefit.name
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// GET /api/admin/benefits or /api/benefits
async function listBenefitsHandler(req, res) {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const benefits = await getAllBenefits(filter);
    
    // Get counts for question mappings and product mappings
    const { getAnswerBenefitCollection } = await import('../../../../models/AnswerBenefit');
    const { getProductBenefitCollection } = await import('../../../../models/ProductBenefit');
    const answerBenefitCollection = await getAnswerBenefitCollection();
    const productBenefitCollection = await getProductBenefitCollection();
    
    const benefitsWithCounts = await Promise.all(
      benefits.map(async (b) => {
        const questionMappings = await answerBenefitCollection.countDocuments({ benefitId: b._id });
        const productMappings = await productBenefitCollection.countDocuments({ benefitId: b._id });
        
        return {
          id: b._id.toString(),
          code: b.code,
          name: b.name,
          description: b.description || null,
          pointWeight: b.pointWeight || 1.0,
          maxScore: b.maxScore !== undefined ? b.maxScore : 3.0,
          isActive: b.isActive !== undefined ? b.isActive : true,
          questionMappings,
          productMappings,
          createdAt: b.createdAt
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: {
        benefits: benefitsWithCounts
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return listBenefitsHandler(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createBenefitHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

