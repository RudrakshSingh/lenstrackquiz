// pages/api/admin/questionnaire/questions/index.js
// Question CRUD endpoints

import { withAuth } from '../../../../../middleware/auth';
import { createQuestionNew, getAllQuestionsNew, getQuestionNewByCode } from '../../../../../models/QuestionNew';
import { getAnswersByQuestion, createAnswerNew } from '../../../../../models/AnswerNew';
import { getAnswerBenefitsByAnswers, syncAnswerBenefits } from '../../../../../models/AnswerBenefit';
import { handleError } from '../../../../../lib/errors';
import { validateQuestionCreateDTO, normalizeQuestionPayload } from '../../../../../lib/dto/questionDTO';
import { validateSubQuestionReference } from '../../../../../lib/validation/questionValidation';

// POST /api/admin/questionnaire/questions
async function createQuestionHandler(req, res) {
  try {
    // Normalize and validate payload
    const validation = validateQuestionCreateDTO(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Validation failed',
          details: validation.errors
        }
      });
    }

    const normalized = normalizeQuestionPayload(req.body);

    // Check if code already exists (if code provided)
    if (normalized.code) {
      const existing = await getQuestionNewByCode(normalized.code);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'RESOURCE_CONFLICT', message: 'Question code already exists' }
        });
      }
    }

    // Prepare question text
    const questionText = {
      en: normalized.text_en,
      hi: normalized.text_hi || normalized.text_en,
      hiEn: normalized.text_hing || normalized.text_hi || normalized.text_en
    };
    
    // Create question
    const question = await createQuestionNew({
      code: normalized.code || `Q_${Date.now()}`,
      text: questionText,
      textEn: normalized.text_en,
      textHi: normalized.text_hi,
      textHiEn: normalized.text_hing,
      category: normalized.category,
      questionType: normalized.questionType,
      displayOrder: normalized.displayOrder,
      isActive: normalized.isActive
    });

    const questionId = question._id.toString();

    // Create answers with benefit mappings
    const createdAnswers = [];
    if (normalized.answers && normalized.answers.length > 0) {
      for (const answerData of normalized.answers) {
        // Validate sub-question reference
        if (answerData.triggersSubQuestion && answerData.subQuestionId) {
          const subQValidation = await validateSubQuestionReference(questionId, answerData.subQuestionId);
          if (!subQValidation.valid) {
            return res.status(400).json({
              success: false,
              error: { 
                code: 'VALIDATION_ERROR', 
                message: `Answer validation failed: ${subQValidation.error}` 
              }
            });
          }
        }

        const answerText = {
          en: answerData.text_en,
          hi: answerData.text_hi || answerData.text_en,
          hiEn: answerData.text_hing || answerData.text_hi || answerData.text_en
        };

        const answer = await createAnswerNew({
          questionId,
          text: answerText,
          textEn: answerData.text_en,
          textHi: answerData.text_hi,
          textHiEn: answerData.text_hing,
          displayOrder: answerData.displayOrder,
          isActive: answerData.isActive,
          triggersSubQuestion: answerData.triggersSubQuestion || false,
          subQuestionId: answerData.triggersSubQuestion ? (answerData.subQuestionId || null) : null
        });

        // Sync benefit mappings - ensure all benefits default to 0 if not provided
        const benefitsArray = [];
        const benefitMapping = answerData.benefitMapping || {};
        
        // Get all available benefits to ensure we save zeros for missing ones
        const { getAllBenefits } = await import('../../../../../models/Benefit');
        const allBenefits = await getAllBenefits({});
        
        // Process provided benefit mappings
        for (const [benefitCode, points] of Object.entries(benefitMapping)) {
          const pointsValue = parseFloat(points) || 0;
          // Clamp to 0-3 range
          const clampedPoints = Math.max(0, Math.min(3, pointsValue));
          benefitsArray.push({
            benefitCode,
            points: clampedPoints
          });
        }

        // Save benefit mappings (including zeros)
        if (benefitsArray.length > 0) {
          await syncAnswerBenefits(answer._id, benefitsArray);
        }

        createdAnswers.push(answer);
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        id: questionId,
        code: question.code,
        answersCount: createdAnswers.length
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// GET /api/admin/questionnaire/questions or /api/questionnaire/questions
async function listQuestionsHandler(req, res) {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const questions = await getAllQuestionsNew(filter);
    
    // Get answers for each question
    const questionsWithAnswers = await Promise.all(
      questions.map(async (q) => {
        const answers = await getAnswersByQuestion(q._id);
        const answerIds = answers.map(a => a._id);
        
        // Get all benefit mappings for these answers
        const answerBenefits = await getAnswerBenefitsByAnswers(answerIds);
        const { getAllBenefits } = await import('../../../../../models/Benefit');
        const allBenefits = await getAllBenefits({});
        const benefitsMap = {};
        allBenefits.forEach(b => {
          benefitsMap[b._id.toString()] = b.code;
        });
        
        // Create a map of answerId -> benefit mappings
        const answerBenefitsMap = {};
        answerBenefits.forEach(ab => {
          const answerId = ab.answerId.toString();
          const benefitCode = benefitsMap[ab.benefitId.toString()];
          if (benefitCode) {
            if (!answerBenefitsMap[answerId]) {
              answerBenefitsMap[answerId] = {};
            }
            answerBenefitsMap[answerId][benefitCode] = ab.points || 0;
          }
        });
        
        // Handle multilingual text - support both old format (string) and new format (object)
        const questionText = typeof q.text === 'string' 
          ? { en: q.text, hi: q.text, hiEn: q.text }
          : (q.text || { en: '', hi: '', hiEn: '' });
        
        return {
          id: q._id.toString(),
          code: q.code,
          text: questionText,
          textEn: questionText.en,
          textHi: questionText.hi,
          textHiEn: questionText.hiEn,
          category: q.category,
          questionType: q.questionType,
          displayOrder: q.displayOrder,
          isActive: q.isActive,
          parentAnswerId: q.parentAnswerId ? q.parentAnswerId.toString() : null,
          answers: answers.map(a => {
            // Handle multilingual text for answers too
            const answerText = typeof a.text === 'string'
              ? { en: a.text, hi: a.text, hiEn: a.text }
              : (a.text || { en: '', hi: '', hiEn: '' });
            const answerId = a._id.toString();
            return {
              id: answerId,
              text: answerText,
              textEn: answerText.en,
              textHi: answerText.hi,
              textHiEn: answerText.hiEn,
              displayOrder: a.displayOrder,
              benefitMapping: answerBenefitsMap[answerId] || {},
              triggersSubQuestion: a.triggersSubQuestion || false,
              subQuestionId: a.subQuestionId ? a.subQuestionId.toString() : null
            };
          })
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        questions: questionsWithAnswers
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return listQuestionsHandler(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createQuestionHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

