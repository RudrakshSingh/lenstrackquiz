// pages/api/admin/questionnaire/questions/[id]/answers.js
// Add answers to a question

import { withAuth } from '../../../../../../middleware/auth';
import { getQuestionNewById } from '../../../../../../models/QuestionNew';
import { createAnswerNew, deleteAnswersByQuestion } from '../../../../../../models/AnswerNew';
import { syncAnswerBenefits } from '../../../../../../models/AnswerBenefit';
import { handleError } from '../../../../../../lib/errors';
import { validateSubQuestionReference } from '../../../../../../lib/validation/questionValidation';

// POST /api/admin/questionnaire/questions/:id/answers
async function addAnswersHandler(req, res) {
  try {
    const { id: questionId } = req.query;
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
      
      // Validate sub-question: prevent self-link
      let subQuestionId = answerData.subQuestionId || answerData.sub_question_id || null;
      const triggersSubQuestion = answerData.triggersSubQuestion || answerData.triggers_sub_question || false;
      
      if (triggersSubQuestion && subQuestionId) {
        // Prevent self-link: answer cannot point to its own parent question
        if (subQuestionId === questionId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'A question cannot be its own sub-question' }
          });
        }
      }

      const answer = await createAnswerNew({
        questionId,
        text: answerText,
        textEn: answerData.textEn || answerData.text_en,
        textHi: answerData.textHi || answerData.text_hi,
        textHiEn: answerData.textHiEn || answerData.text_hing || answerData.text_hi_en,
        displayOrder: answerData.displayOrder !== undefined ? answerData.displayOrder : (answerData.display_order !== undefined ? answerData.display_order : createdAnswers.length),
        isActive: answerData.isActive !== undefined ? answerData.isActive : (answerData.is_active !== undefined ? answerData.is_active : true),
        triggersSubQuestion: triggersSubQuestion,
        subQuestionId: triggersSubQuestion ? subQuestionId : null
      });
      createdAnswers.push(answer);

      // Sync benefits if provided - support both array and object format
      let benefitsArray = [];
      if (answerData.benefits && Array.isArray(answerData.benefits)) {
        benefitsArray = answerData.benefits;
      } else if (answerData.benefitMapping && typeof answerData.benefitMapping === 'object') {
        // Convert benefitMapping object to array format
        for (const [benefitCode, points] of Object.entries(answerData.benefitMapping)) {
          const pointsValue = parseFloat(points) || 0;
          const clampedPoints = Math.max(0, Math.min(3, pointsValue));
          if (clampedPoints > 0) {
            benefitsArray.push({
              benefitCode,
              points: clampedPoints
            });
          }
        }
      }

      if (benefitsArray.length > 0) {
        await syncAnswerBenefits(answer._id, benefitsArray);
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

