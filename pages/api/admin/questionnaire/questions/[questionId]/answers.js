// pages/api/admin/questionnaire/questions/[questionId]/answers.js
// Add answers to a question

import { withAuth } from '../../../../../../middleware/auth';
import { getQuestionNewById } from '../../../../../../models/QuestionNew';
import { createAnswerNew, deleteAnswersByQuestion } from '../../../../../../models/AnswerNew';
import { syncAnswerBenefits } from '../../../../../../models/AnswerBenefit';
import { handleError } from '../../../../../../lib/errors';

// POST /api/admin/questionnaire/questions/:questionId/answers
async function addAnswersHandler(req, res) {
  try {
    const { questionId } = req.query;
    const { answers } = req.body;

    // Validate question exists
    const question = await getQuestionNewById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    // Validate answers format
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'answers must be an array' }
      });
    }

    // Delete existing answers
    await deleteAnswersByQuestion(questionId);

    // Create new answers
    const createdAnswers = [];
    for (const answerData of answers) {
      // Support both old format (text as string) and new format (text as object or separate fields)
      const answerText = answerData.text || (answerData.textEn || answerData.textHi || answerData.textHiEn 
        ? { en: answerData.textEn || '', hi: answerData.textHi || '', hiEn: answerData.textHiEn || '' }
        : null);
      
      const answer = await createAnswerNew({
        questionId,
        text: answerText,
        textEn: answerData.textEn,
        textHi: answerData.textHi,
        textHiEn: answerData.textHiEn,
        displayOrder: answerData.displayOrder || 0
      });
      createdAnswers.push(answer);

      // Sync benefits if provided
      if (answerData.benefits && Array.isArray(answerData.benefits)) {
        await syncAnswerBenefits(answer._id, answerData.benefits);
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        answers: createdAnswers.map(a => {
          // Handle multilingual text - support both old format (string) and new format (object)
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
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'POST') {
    return withAuth(addAnswersHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

