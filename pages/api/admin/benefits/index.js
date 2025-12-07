// pages/api/admin/benefits/index.js
// Benefits CRUD endpoints

import { withAuth } from '../../../../middleware/auth';
import { createBenefit, getAllBenefits, getBenefitByCode } from '../../../../models/Benefit';
import { handleError } from '../../../../lib/errors';

// POST /api/admin/benefits
async function createBenefitHandler(req, res) {
  try {
    const { code, name, description, pointWeight, relatedProblems, relatedUsage } = req.body;

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
      relatedProblems: relatedProblems || [],
      relatedUsage: relatedUsage || []
    });

    return res.status(201).json({
      success: true,
      data: {
        id: benefit._id.toString(),
        code: benefit.code
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// GET /api/admin/benefits or /api/benefits
async function listBenefitsHandler(req, res) {
  try {
    const benefits = await getAllBenefits({});
    
    return res.status(200).json({
      success: true,
      data: {
        benefits: benefits.map(b => ({
          id: b._id.toString(),
          code: b.code,
          name: b.name,
          description: b.description,
          pointWeight: b.pointWeight,
          relatedProblems: b.relatedProblems,
          relatedUsage: b.relatedUsage
        }))
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

