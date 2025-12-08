// lib/dto/questionDTO.js
// Data Transfer Objects for Question/Answer validation and transformation

/**
 * Validate and transform question creation payload
 */
export function validateQuestionCreateDTO(body) {
  const errors = [];

  // Required fields
  if (!body.text_en && !body.textEn) {
    errors.push('text_en is required');
  }

  if (!body.category) {
    errors.push('category is required');
  } else {
    const validCategories = ['USAGE', 'PROBLEM', 'PROBLEMS', 'LIFESTYLE', 'ENVIRONMENT', 'BUDGET'];
    if (!validCategories.includes(body.category)) {
      errors.push(`category must be one of: ${validCategories.join(', ')}`);
    }
  }

  if (!body.questionType && !body.question_type) {
    errors.push('questionType is required');
  } else {
    const validTypes = ['SINGLE_SELECT', 'MULTI_SELECT', 'SLIDER'];
    const questionType = body.questionType || body.question_type;
    if (!validTypes.includes(questionType)) {
      errors.push(`questionType must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate answers if provided
  if (body.answers && Array.isArray(body.answers)) {
    body.answers.forEach((answer, index) => {
      if (!answer.text_en && !answer.textEn) {
        errors.push(`Answer ${index + 1}: text_en is required`);
      }

      // Validate benefit mapping
      if (answer.benefitMapping && typeof answer.benefitMapping === 'object') {
        Object.entries(answer.benefitMapping).forEach(([benefitCode, points]) => {
          if (!/^B\d{2}$/.test(benefitCode)) {
            errors.push(`Answer ${index + 1}: Invalid benefit code ${benefitCode}. Must be B01-B12 format`);
          }
          const pointsValue = parseFloat(points);
          if (isNaN(pointsValue) || pointsValue < 0 || pointsValue > 3) {
            errors.push(`Answer ${index + 1}: Benefit ${benefitCode} points must be between 0 and 3`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Transform request body to normalized format
 */
export function normalizeQuestionPayload(body) {
  return {
    code: body.code,
    text_en: body.text_en || body.textEn || '',
    text_hi: body.text_hi || body.textHi || null,
    text_hing: body.text_hing || body.textHing || body.textHiEn || null,
    category: body.category,
    questionType: body.questionType || body.question_type,
    displayOrder: body.displayOrder || body.display_order || 0,
    isActive: body.isActive !== undefined ? body.isActive : (body.is_active !== undefined ? body.is_active : true),
    answers: body.answers ? body.answers.map(answer => ({
      text_en: answer.text_en || answer.textEn || '',
      text_hi: answer.text_hi || answer.textHi || null,
      text_hing: answer.text_hing || answer.textHing || answer.textHiEn || null,
      displayOrder: answer.displayOrder !== undefined ? answer.displayOrder : (answer.display_order !== undefined ? answer.display_order : 0),
      isActive: answer.isActive !== undefined ? answer.isActive : (answer.is_active !== undefined ? answer.is_active : true),
      triggersSubQuestion: answer.triggersSubQuestion || answer.triggers_sub_question || false,
      subQuestionId: answer.subQuestionId || answer.sub_question_id || null,
      benefitMapping: answer.benefitMapping || answer.benefit_mapping || {}
    })) : []
  };
}

