// services/lensProducts.js
// Service for Lens Product API endpoints (new spec)

import { api } from '../lib/api-client';

export const lensProductService = {
  list: async (params) => {
    try {
      const response = await api.get('/admin/products/lenses', params);
      // API returns { success: true, data: { products: [...] } }
      // api.get() extracts data.data, so response is { products: [...] }
      if (response && typeof response === 'object') {
        // Check if response has products array
        if (Array.isArray(response.products)) {
          return response.products;
        }
        // Check if response itself is an array
        if (Array.isArray(response)) {
          return response;
        }
        // Check if response has data.products (nested)
        if (response.data && Array.isArray(response.data.products)) {
          return response.data.products;
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching lens products:', error);
      throw error; // Re-throw to let component handle it
    }
  },
  get: async (id) => {
    const response = await api.get(`/admin/products/lenses/${id}`);
    // api.get() extracts data.data, so response is the product object directly
    return { data: response };
  },
  getByItCode: (itCode) => api.get(`/products/lenses/${itCode}`),
  create: (data) => api.post('/admin/products/lenses', data),
  update: (id, data) => api.put(`/admin/products/lenses/${id}`, data),
  delete: (id) => api.delete(`/admin/products/lenses/${id}`),
  
  // Product relationships
  setSpecs: (id, specs) => api.put(`/admin/products/lenses/${id}/specs`, { specs }),
  setFeatures: (id, featureCodes) => api.put(`/admin/products/lenses/${id}/features`, { featureCodes }),
  setBenefits: (id, benefits) => api.put(`/admin/products/lenses/${id}/benefits`, { benefits }),
  setAnswerScores: (id, mappings) => api.put(`/admin/products/lenses/${id}/answer-scores`, { mappings }),
};

