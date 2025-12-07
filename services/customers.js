import { api } from '../lib/api-client';

export const customerService = {
  list: async (params) => {
    const response = await api.get('/admin/customers', params);
    return response;
  },
  get: (id) => api.get(`/admin/customers/${id}`),
};

