// pages/api/questionnaire/questions/index.js
// Public endpoint to get questions

import { getAllQuestionsNew } from '../../../../models/QuestionNew';
import { getAnswersByQuestion } from '../../../../models/AnswerNew';
import { handleError } from '../../../../lib/errors';

// GET /api/questionnaire/questions
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
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

