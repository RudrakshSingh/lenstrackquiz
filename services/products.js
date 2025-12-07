import { api } from '../lib/api-client';

export const productService = {
  list: async (params) => {
    const response = await api.get('/admin/products', params);
    return Array.isArray(response) ? response : response?.products || [];
  },
  get: (id) => api.get(`/admin/products/${id}`),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
  updateStoreProduct: (productId, storeId, data) =>
    api.put(`/admin/products/${productId}/store/${storeId}`, data),
};

