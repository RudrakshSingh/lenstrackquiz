import { api } from '../lib/api-client';

export const questionService = {
  list: async (params) => {
    const response = await api.get('/admin/questions', params);
    return Array.isArray(response) ? response : response?.questions || [];
  },
  get: (id) => api.get(`/admin/questions/${id}`),
  create: (data) => api.post('/admin/questions', data),
  update: (id, data) => api.put(`/admin/questions/${id}`, data),
  delete: (id) => api.delete(`/admin/questions/${id}`),
};

