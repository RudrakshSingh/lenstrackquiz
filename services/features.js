import { api } from '../lib/api-client';

export const featureService = {
  list: async (params) => {
    const response = await api.get('/admin/features', params);
    // API returns { success: true, data: { features: [...] } }
    // api-client extracts data, so response is { features: [...] }
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.features && Array.isArray(response.features)) {
      return response.features;
    }
    if (response?.data?.features && Array.isArray(response.data.features)) {
      return response.data.features;
    }
    return [];
  },
  get: (id) => api.get(`/admin/features/${id}`),
  create: (data) => {
    // Ensure code is set (map key to code if needed)
    const payload = {
      ...data,
      code: data.code || data.key
    };
    if (payload.key && !payload.code) {
      payload.code = payload.key;
    }
    return api.post('/admin/features', payload);
  },
  update: (id, data) => {
    // Ensure code is set (map key to code if needed)
    const payload = {
      ...data,
      code: data.code || data.key
    };
    if (payload.key && !payload.code) {
      payload.code = payload.key;
    }
    return api.put(`/admin/features/${id}`, payload);
  },
  delete: (id) => api.delete(`/admin/features/${id}`),
};

