// pages/api/admin/benefits/[id].js
// Get, Update, Delete specific benefit

import { withAuth } from '../../../../middleware/auth';
import { getBenefitById, updateBenefit, deleteBenefit } from '../../../../models/Benefit';
import { handleError, NotFoundError } from '../../../../lib/errors';
import { ObjectId } from 'mongodb';

// GET /api/admin/benefits/:id
async function getBenefitHandler(req, res) {
  try {
    const { id } = req.query;
    const benefit = await getBenefitById(id);
    
    if (!benefit) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Benefit not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: benefit._id.toString(),
        code: benefit.code,
        name: benefit.name,
        description: benefit.description || null,
        pointWeight: benefit.pointWeight || 1.0,
        maxScore: benefit.maxScore !== undefined ? benefit.maxScore : 3.0,
        isActive: benefit.isActive !== undefined ? benefit.isActive : true,
        createdAt: benefit.createdAt,
        updatedAt: benefit.updatedAt
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/benefits/:id
async function updateBenefitHandler(req, res) {
  try {
    const { id } = req.query;
    const { name, description, pointWeight, maxScore, isActive } = req.body;

    const existing = await getBenefitById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Benefit not found' }
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (pointWeight !== undefined) updateData.pointWeight = pointWeight;
    if (maxScore !== undefined) updateData.maxScore = maxScore;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await updateBenefit(id, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Benefit not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updated._id.toString(),
        code: updated.code,
        name: updated.name,
        description: updated.description,
        pointWeight: updated.pointWeight,
        maxScore: updated.maxScore,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/admin/benefits/:id
async function deleteBenefitHandler(req, res) {
  try {
    const { id } = req.query;
    
    // Check if benefit is used in any answers or products
    const { getAnswerBenefitCollection } = await import('../../../../models/AnswerBenefit');
    const { getProductBenefitCollection } = await import('../../../../models/ProductBenefit');
    const answerBenefitCollection = await getAnswerBenefitCollection();
    const productBenefitCollection = await getProductBenefitCollection();
    
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const answerCount = await answerBenefitCollection.countDocuments({ benefitId: objectId });
    const productCount = await productBenefitCollection.countDocuments({ benefitId: objectId });
    
    if (answerCount > 0 || productCount > 0) {
      return res.status(409).json({
        success: false,
        error: { 
          code: 'RESOURCE_IN_USE', 
          message: `Cannot delete benefit. It is used by ${answerCount} answer(s) and ${productCount} product(s).` 
        }
      });
    }

    const result = await deleteBenefit(id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Benefit not found' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Benefit deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return getBenefitHandler(req, res);
  }
  if (req.method === 'PUT') {
    return withAuth(updateBenefitHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  if (req.method === 'DELETE') {
    return withAuth(deleteBenefitHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER');

