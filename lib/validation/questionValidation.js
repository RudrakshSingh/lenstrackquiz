// lib/validation/questionValidation.js
// Validation utilities for questions and answers

import { getAllQuestionsNew } from '../../models/QuestionNew';
import { getAnswersByQuestion } from '../../models/AnswerNew';

/**
 * Check for circular references in sub-question relationships
 * @param {string} questionId - The question ID to check
 * @param {string} subQuestionId - The sub-question ID being assigned
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateSubQuestionReference(questionId, subQuestionId) {
  if (!subQuestionId) {
    return { valid: true };
  }

  // Prevent self-link
  if (questionId === subQuestionId) {
    return {
      valid: false,
      error: 'A question cannot be its own sub-question'
    };
  }

  // Check for circular references using DFS
  const visited = new Set();
  const checkCycle = async (currentQId, targetQId, path = []) => {
    // If we've already visited this question, skip
    if (visited.has(currentQId)) {
      return false;
    }
    visited.add(currentQId);

    // If current question is the target, we found a cycle
    if (currentQId === targetQId && path.length > 0) {
      return true;
    }

    // Get all answers for current question
    const answers = await getAnswersByQuestion(currentQId);
    
    // Check each answer that triggers a sub-question
    for (const answer of answers) {
      if (answer.triggersSubQuestion && answer.subQuestionId) {
        const subQId = answer.subQuestionId.toString();
        // Recursively check if this sub-question eventually leads back to target
        if (await checkCycle(subQId, targetQId, [...path, currentQId])) {
          return true;
        }
      }
    }

    return false;
  };

  // Check if setting subQuestionId would create a cycle back to questionId
  const hasCycle = await checkCycle(subQuestionId, questionId, []);
  
  if (hasCycle) {
    return {
      valid: false,
      error: 'Circular reference detected. This would create a loop in the question flow.'
    };
  }

  return { valid: true };
}

/**
 * Validate benefit points
 */
export function validateBenefitPoints(points) {
  const numValue = parseFloat(points);
  if (isNaN(numValue)) {
    return { valid: false, error: 'Benefit points must be a number' };
  }
  if (numValue < 0 || numValue > 3) {
    return { valid: false, error: 'Benefit points must be between 0 and 3' };
  }
  return { valid: true, value: numValue };
}

/**
 * Validate benefit mapping object
 */
export function validateBenefitMapping(mapping) {
  if (!mapping || typeof mapping !== 'object') {
    return { valid: false, error: 'Benefit mapping must be an object' };
  }

  for (const [benefitCode, points] of Object.entries(mapping)) {
    if (!/^B\d{2}$/.test(benefitCode)) {
      return { valid: false, error: `Invalid benefit code: ${benefitCode}. Must be B01-B12 format` };
    }
    const pointsValidation = validateBenefitPoints(points);
    if (!pointsValidation.valid) {
      return { valid: false, error: `Benefit ${benefitCode}: ${pointsValidation.error}` };
    }
  }

  return { valid: true };
}

/**
 * Validate answer data
 */
export async function validateAnswer(answerData, questionId = null) {
  const errors = [];

  if (!answerData.text_en && !answerData.textEn) {
    errors.push('Answer text (English) is required');
  }

  // Validate benefit mapping if provided
  if (answerData.benefitMapping) {
    const mappingValidation = validateBenefitMapping(answerData.benefitMapping);
    if (!mappingValidation.valid) {
      errors.push(mappingValidation.error);
    }
  }

  // Validate sub-question reference if provided
  if (answerData.triggersSubQuestion && answerData.subQuestionId && questionId) {
    const subQValidation = await validateSubQuestionReference(questionId, answerData.subQuestionId);
    if (!subQValidation.valid) {
      errors.push(subQValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate question data
 */
export async function validateQuestion(questionData) {
  const errors = [];

  if (!questionData.text_en && !questionData.textEn) {
    errors.push('Question text (English) is required');
  }

  if (!questionData.category) {
    errors.push('Category is required');
  }

  if (!questionData.questionType && !questionData.question_type) {
    errors.push('Question type is required');
  }

  // Validate answers if provided
  if (questionData.answers && Array.isArray(questionData.answers)) {
    const questionId = questionData.id || questionData._id?.toString();
    for (let i = 0; i < questionData.answers.length; i++) {
      const answer = questionData.answers[i];
      const answerValidation = await validateAnswer(answer, questionId);
      if (!answerValidation.valid) {
        errors.push(`Answer ${i + 1}: ${answerValidation.errors.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
