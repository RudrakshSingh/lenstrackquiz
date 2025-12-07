// pages/api/benefits/index.js
// Public endpoint to list benefits

import { getAllBenefits } from '../../../models/Benefit';
import { handleError } from '../../../lib/errors';

// GET /api/benefits
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
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

