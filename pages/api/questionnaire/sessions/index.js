// pages/api/questionnaire/sessions/index.js
// Start new questionnaire session

import { withAuth } from '../../../../middleware/auth';
import { CreateSessionSchema } from '../../../../lib/validation';
import { createSession } from '../../../../models/Session';
import { getAllQuestions } from '../../../../models/Question';
import { getAnswerOptionsByQuestion } from '../../../../models/AnswerOption';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }

    const user = req.user;

    // Validate input
    const validationResult = CreateSessionSchema.safeParse(req.body);
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

    // Create session
    const session = await createSession({
      storeId: user.storeId || req.body.storeId,
      userId: user._id,
      category: validationResult.data.category,
      customerName: validationResult.data.customerName,
      customerPhone: validationResult.data.customerPhone,
      customerEmail: validationResult.data.customerEmail
    });

    // Get first batch of questions
    const questions = await getAllQuestions({
      organizationId: user.organizationId,
      category: validationResult.data.category,
      isActive: true
    });

    // Sort by order and get first question
    questions.sort((a, b) => (a.order || 0) - (b.order || 0));
    const firstQuestion = questions[0];

    // Get options for first question
    let questionWithOptions = null;
    if (firstQuestion) {
      const options = await getAnswerOptionsByQuestion(firstQuestion._id);
      questionWithOptions = {
        id: firstQuestion._id.toString(),
        key: firstQuestion.key,
        textEn: firstQuestion.textEn,
        textHi: firstQuestion.textHi,
        textHiEn: firstQuestion.textHiEn,
        isRequired: firstQuestion.isRequired,
        allowMultiple: firstQuestion.allowMultiple,
        options: options.map(opt => ({
          id: opt._id.toString(),
          key: opt.key,
          textEn: opt.textEn,
          textHi: opt.textHi,
          textHiEn: opt.textHiEn,
          icon: opt.icon
        }))
      };
    }

    return res.status(201).json({
      success: true,
      data: {
        sessionId: session._id.toString(),
        questions: questionWithOptions ? [questionWithOptions] : [],
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

