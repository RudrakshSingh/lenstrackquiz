// pages/api/admin/questionnaire/questions/index.js
// Question CRUD endpoints

import { withAuth } from '../../../../../middleware/auth';
import { createQuestionNew, getAllQuestionsNew, getQuestionNewByCode } from '../../../../../models/QuestionNew';
import { getAnswersByQuestion } from '../../../../../models/AnswerNew';
import { handleError } from '../../../../../lib/errors';

// POST /api/admin/questionnaire/questions
async function createQuestionHandler(req, res) {
  try {
    const { code, text, textEn, textHi, textHiEn, category, questionType, displayOrder, isActive, parentAnswerId } = req.body;

    // Validation - support both old format (text as string) and new format (text as object or separate fields)
    const hasText = text || (textEn || textHi || textHiEn);
    if (!code || !hasText || !category || !questionType) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'code, text (or textEn/textHi/textHiEn), category, and questionType are required' }
      });
    }

    // Check if code already exists
    const existing = await getQuestionNewByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Question code already exists' }
      });
    }

    // Prepare text data - support multiple formats
    const questionText = text || (textEn || textHi || textHiEn ? { en: textEn || '', hi: textHi || '', hiEn: textHiEn || '' } : null);
    
    const question = await createQuestionNew({
      code,
      text: questionText,
      textEn,
      textHi,
      textHiEn,
      category,
      questionType,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      parentAnswerId
    });

    return res.status(201).json({
      success: true,
      data: {
        id: question._id.toString(),
        code: question.code
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
            return {
              id: a._id.toString(),
              text: answerText,
              textEn: answerText.en,
              textHi: answerText.hi,
              textHiEn: answerText.hiEn,
              displayOrder: a.displayOrder
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

