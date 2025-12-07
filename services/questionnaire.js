// services/questionnaire.js
// Service for Questionnaire API endpoints (new spec)

import { api } from '../lib/api-client';

export const questionnaireService = {
  // Questions
  listQuestions: async (params) => {
    const response = await api.get('/admin/questionnaire/questions', params);
    return response.data?.questions || [];
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

