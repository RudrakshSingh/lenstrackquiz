// pages/api/admin/questions/index.js
// Question management endpoints (updated for LensTrack spec)

import { withAuth, authorize } from '../../../../middleware/auth';
import { CreateQuestionSchema } from '../../../../lib/validation';
import { createQuestion, getAllQuestions, getQuestionByKey } from '../../../../models/Question';
import { createAnswerOption, deleteAnswerOptionsByQuestion } from '../../../../models/AnswerOption';
import { createFeatureMapping, deleteFeatureMappingsByQuestion } from '../../../../models/FeatureMapping';
import { getFeatureByKey } from '../../../../models/Feature';
import { handleError, ConflictError } from '../../../../lib/errors';

// GET /api/admin/questions
async function listQuestions(req, res) {
  try {
    const { category, isActive } = req.query;
    // Allow public access for GET requests (for customer UI)
    const user = req.user || {};
    
    // If no user, allow public access but filter by isActive only
    const filter = {};
    if (user.organizationId) {
      filter.organizationId = user.organizationId;
    }
    if (category) filter.category = category;
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    } else {
      // Default to active questions for public access
      filter.isActive = true;
    }

    const questions = await getAllQuestions(filter);

    // Get options and mappings for each question
    const questionsWithDetails = await Promise.all(questions.map(async (question) => {
      const { getAnswerOptionsByQuestion } = await import('../../../../models/AnswerOption');
      const { getFeatureMappingsByQuestion } = await import('../../../../models/FeatureMapping');
      
      const options = await getAnswerOptionsByQuestion(question._id);
      const mappings = await getFeatureMappingsByQuestion(question._id);

      return {
        id: question._id.toString(),
        key: question.key,
        textEn: question.textEn,
        textHi: question.textHi,
        textHiEn: question.textHiEn,
        category: question.category,
        order: question.order,
        isRequired: question.isRequired,
        allowMultiple: question.allowMultiple,
        showIf: question.showIf,
        isActive: question.isActive,
        options,
        mappings,
        createdAt: question.createdAt
      };
    }));

    return res.status(200).json({
      success: true,
      data: { questions: questionsWithDetails }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/admin/questions
async function createQuestionHandler(req, res) {
  try {
    const user = req.user;
    authorize('SUPER_ADMIN', 'ADMIN')(user);

    // Validate input
    const validationResult = CreateQuestionSchema.safeParse(req.body);
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

    // Check if question key already exists
    const existing = await getQuestionByKey(user.organizationId, validationResult.data.key);
    if (existing) {
      throw new ConflictError('Question key already exists');
    }

    // Create question with proper data structure
    const questionData = {
      key: validationResult.data.key,
      textEn: validationResult.data.textEn,
      textHi: validationResult.data.textHi || null,
      textHiEn: validationResult.data.textHiEn || null,
      category: validationResult.data.category,
      order: validationResult.data.order || 0,
      isRequired: validationResult.data.isRequired !== false,
      allowMultiple: validationResult.data.allowMultiple || false,
      showIf: validationResult.data.showIf || null,
      organizationId: user.organizationId
    };
    
    const question = await createQuestion(questionData);

    // Create answer options
    if (validationResult.data.options && validationResult.data.options.length > 0) {
      for (const optionData of validationResult.data.options) {
        await createAnswerOption({
          ...optionData,
          questionId: question._id
        });
      }
    }

    // Create feature mappings
    if (validationResult.data.mappings && validationResult.data.mappings.length > 0) {
      for (const mappingData of validationResult.data.mappings) {
        // Get feature by key
        const feature = await getFeatureByKey(user.organizationId, mappingData.featureKey, validationResult.data.category);
        if (feature) {
          await createFeatureMapping({
            questionId: question._id,
            optionKey: mappingData.optionKey,
            featureId: feature._id,
            weight: mappingData.weight
          });
        }
      }
    }

    // Get full question with options and mappings
    const { getAnswerOptionsByQuestion } = await import('../../../../models/AnswerOption');
    const { getFeatureMappingsByQuestion } = await import('../../../../models/FeatureMapping');
    const options = await getAnswerOptionsByQuestion(question._id);
    const mappings = await getFeatureMappingsByQuestion(question._id);

    return res.status(201).json({
      success: true,
      data: {
        id: question._id.toString(),
        ...question,
        _id: undefined,
        organizationId: question.organizationId.toString(),
        options,
        mappings
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// Allow public GET access for customer UI, but require auth for POST
async function handler(req, res) {
  if (req.method === 'GET') {
    // Public access for GET - no auth required
    return listQuestions(req, res);
  }
  if (req.method === 'POST') {
    // Require auth for POST
    return withAuth(createQuestionHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;
