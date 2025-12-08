// services/questionnaire.js
// Service for Questionnaire API endpoints (new spec)

import { api } from '../lib/api-client';

export const questionnaireService = {
  // Questions
  listQuestions: async (params) => {
    const response = await api.get('/admin/questionnaire/questions', params);
    // API returns { success: true, data: { questions: [...] } }
    // api.get extracts data, so response is { questions: [...] }
    // Handle various response structures
    if (Array.isArray(response)) {
      return response;
    }
    // Check for nested structure
    if (response?.data?.questions && Array.isArray(response.data.questions)) {
      return response.data.questions;
    }
    // Check for direct questions property
    if (response?.questions && Array.isArray(response.questions)) {
      return response.questions;
    }
    // Fallback to empty array
    console.warn('Unexpected response structure from listQuestions:', response);
    return [];
  },
  getQuestion: (id) => api.get(`/admin/questionnaire/questions/${id}`),
  createQuestion: (data) => api.post('/admin/questionnaire/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/questionnaire/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/questionnaire/questions/${id}`),
  
  // Answers
  addAnswers: (questionId, answers) => 
    api.post(`/admin/questionnaire/questions/${questionId}/answers`, { answers }),
  updateAnswerBenefits: (answerId, benefits) =>
    api.put(`/admin/questionnaire/answers/${answerId}/benefits`, { benefits }),
};

