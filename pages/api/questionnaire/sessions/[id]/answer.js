// pages/api/questionnaire/sessions/[id]/answer.js
// Submit answer and get next question or recommendations

import { withAuth } from '../../../../../middleware/auth';
import { AnswerQuestionSchema } from '../../../../../lib/validation';
import { getSessionById, updateSession } from '../../../../../models/Session';
import { createSessionAnswer } from '../../../../../models/SessionAnswer';
import { getAllQuestions } from '../../../../../models/Question';
import { getAnswerOptionsByQuestion } from '../../../../../models/AnswerOption';
import { getSessionAnswersBySession } from '../../../../../models/SessionAnswer';
import { getRecommendations } from '../../../../../lib/recommendationEngine';
import { createSessionRecommendation } from '../../../../../models/SessionRecommendation';
import { handleError, NotFoundError } from '../../../../../lib/errors';

async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }

    const { id: sessionId } = req.query;
    const user = req.user;

    // Get session
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Validate input
    const validationResult = AnswerQuestionSchema.safeParse(req.body);
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

    // Save answers
    for (const optionId of validationResult.data.optionIds) {
      await createSessionAnswer({
        sessionId: session._id,
        questionId: validationResult.data.questionId,
        optionId
      });
    }

    // Get all questions
    const allQuestions = await getAllQuestions({
      organizationId: user.organizationId,
      category: session.category,
      isActive: true
    });
    allQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Get answered questions
    const answeredQuestions = await getSessionAnswersBySession(session._id);
    const answeredQuestionIds = new Set(answeredQuestions.map(a => a.questionId.toString()));

    // Find next unanswered question
    const nextQuestion = allQuestions.find(q => !answeredQuestionIds.has(q._id.toString()));

    if (nextQuestion) {
      // More questions to answer
      const options = await getAnswerOptionsByQuestion(nextQuestion._id);
      return res.status(200).json({
        success: true,
        data: {
          nextQuestion: {
            id: nextQuestion._id.toString(),
            key: nextQuestion.key,
            textEn: nextQuestion.textEn,
            textHi: nextQuestion.textHi,
            textHiEn: nextQuestion.textHiEn,
            isRequired: nextQuestion.isRequired,
            allowMultiple: nextQuestion.allowMultiple,
            options: options.map(opt => ({
              id: opt._id.toString(),
              key: opt.key,
              textEn: opt.textEn,
              textHi: opt.textHi,
              textHiEn: opt.textHiEn,
              icon: opt.icon
            }))
          },
          progress: answeredQuestionIds.size + 1,
          totalQuestions: allQuestions.length
        }
      });
    } else {
      // All questions answered - generate recommendations
      await updateSession(sessionId, {
        status: 'COMPLETED',
        completedAt: new Date()
      });

      const recommendations = await getRecommendations(
        sessionId,
        session.storeId.toString(),
        session.category,
        10
      );

      // Save recommendations
      for (const rec of recommendations) {
        await createSessionRecommendation({
          sessionId: session._id,
          productId: rec.product._id,
          matchScore: rec.matchScore,
          rank: rec.rank,
          isSelected: false
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          complete: true,
          recommendations: recommendations.map(rec => ({
            product: {
              id: rec.product._id.toString(),
              sku: rec.product.sku,
              name: rec.product.name,
              description: rec.product.description,
              brand: rec.product.brand,
              imageUrl: rec.product.imageUrl,
              basePrice: rec.product.basePrice
            },
            matchScore: Math.round(rec.matchScore * 10) / 10,
            rank: rec.rank,
            storePrice: rec.storePrice,
            inStock: rec.inStock,
            stockQuantity: rec.stockQuantity
          }))
        }
      });
    }
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

