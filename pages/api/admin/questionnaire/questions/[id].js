// pages/api/admin/questionnaire/questions/[id].js
// Get, update, and delete a specific question

import { withAuth } from '../../../../../middleware/auth';
import { getQuestionNewById, updateQuestionNew, deleteQuestionNew } from '../../../../../models/QuestionNew';
import { getAnswersByQuestion } from '../../../../../models/AnswerNew';
import { getAnswerBenefitsByAnswers } from '../../../../../models/AnswerBenefit';
import { handleError } from '../../../../../lib/errors';

// GET /api/admin/questionnaire/questions/:id
async function getQuestionHandler(req, res) {
  try {
    const { id } = req.query;
    const question = await getQuestionNewById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    // Get answers with benefit mappings
    const answers = await getAnswersByQuestion(question._id);
    const answerIds = answers.map(a => a._id);
    const answerBenefits = await getAnswerBenefitsByAnswers(answerIds);
    const { getAllBenefits } = await import('../../../../../models/Benefit');
    const allBenefits = await getAllBenefits({});
    const benefitsMap = {};
    allBenefits.forEach(b => {
      benefitsMap[b._id.toString()] = b.code;
    });
    
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

    const questionText = typeof question.text === 'string'
      ? { en: question.text, hi: question.text, hiEn: question.text }
      : (question.text || { en: '', hi: '', hiEn: '' });

    return res.status(200).json({
      success: true,
      data: {
        id: question._id.toString(),
        code: question.code,
        text: questionText,
        textEn: questionText.en,
        textHi: questionText.hi,
        textHiEn: questionText.hiEn,
        category: question.category,
        questionType: question.questionType,
        displayOrder: question.displayOrder || 0,
        isActive: question.isActive !== undefined ? question.isActive : true,
        answers: answers.map(a => {
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
            displayOrder: a.displayOrder !== undefined ? a.displayOrder : 0,
            isActive: a.isActive !== undefined ? a.isActive : true,
            triggersSubQuestion: a.triggersSubQuestion || false,
            subQuestionId: a.subQuestionId ? a.subQuestionId.toString() : null,
            benefitMapping: answerBenefitsMap[answerId] || {}
          };
        })
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/admin/questionnaire/questions/:id
async function updateQuestionHandler(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    // Check if question exists
    const question = await getQuestionNewById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    // Prepare update data
    const update = {};
    if (updateData.displayOrder !== undefined) {
      update.displayOrder = parseInt(updateData.displayOrder) || 0;
    }
    if (updateData.code !== undefined) update.code = updateData.code;
    if (updateData.category !== undefined) update.category = updateData.category;
    if (updateData.questionType !== undefined) update.questionType = updateData.questionType;
    if (updateData.isActive !== undefined) update.isActive = updateData.isActive;
    
    // Handle text updates
    if (updateData.textEn !== undefined || updateData.textHi !== undefined || updateData.textHiEn !== undefined) {
      const currentText = typeof question.text === 'string'
        ? { en: question.text, hi: question.text, hiEn: question.text }
        : (question.text || { en: '', hi: '', hiEn: '' });
      
      update.text = {
        en: updateData.textEn !== undefined ? updateData.textEn : currentText.en,
        hi: updateData.textHi !== undefined ? updateData.textHi : currentText.hi,
        hiEn: updateData.textHiEn !== undefined ? updateData.textHiEn : currentText.hiEn
      };
    }

    const updated = await updateQuestionNew(id, update);

    return res.status(200).json({
      success: true,
      data: {
        id: updated._id.toString(),
        code: updated.code,
        displayOrder: updated.displayOrder || 0,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/admin/questionnaire/questions/:id
async function deleteQuestionHandler(req, res) {
  try {
    const { id } = req.query;
    
    const question = await getQuestionNewById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    await deleteQuestionNew(id);

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(getQuestionHandler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER')(req, res);
  }
  if (req.method === 'PUT') {
    return withAuth(updateQuestionHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  if (req.method === 'DELETE') {
    return withAuth(deleteQuestionHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

