import { api } from '../lib/api-client';

export const storeService = {
  list: async (params) => {
    const response = await api.get('/admin/stores', params);
    // Handle both response formats: { stores: [...] } or { data: { stores: [...] } }
    if (response?.data?.stores) {
      return response.data.stores;
    } else if (response?.stores) {
      return response.stores;
    } else if (Array.isArray(response)) {
      return response;
    }
    return [];
  },
  get: async (id) => {
    const response = await api.get(`/admin/stores/${id}`);
    return response?.data || response;
  },
  create: async (data) => {
    const response = await api.post('/admin/stores', data);
    return response?.data || response;
  },
  update: async (id, data) => {
    const response = await api.put(`/admin/stores/${id}`, data);
    return response?.data || response;
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/stores/${id}`);
    return response;
  },
  getStats: async (id) => {
    const response = await api.get(`/admin/stores/${id}/stats`);
    return response?.data || response;
  },
};

