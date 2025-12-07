// services/offers.js
// Service for Offer Engine API endpoints

import { api } from '../lib/api-client';

export const offerService = {
  // Offer Rules
  listRules: async (params) => {
    const response = await api.get('/admin/offers', params);
    // API client returns data.data, so response is already the data object
    return response?.offers || response || [];
  },
  getRule: (id) => api.get(`/admin/offers/${id}`),
  createRule: (data) => api.post('/admin/offers', data),
  updateRule: (id, data) => api.put(`/admin/offers/${id}`, data),
  deleteRule: (id) => api.delete(`/admin/offers/${id}`),
  
  // Calculate offers (supports both old and new endpoints)
  calculate: async (data) => {
    const response = await api.post('/offer-engine/calculate', data);
    // API client returns data.data, so response is already the data object
    return { data: response };
  },
  
  // Category Discounts
  listCategoryDiscounts: async (params) => {
    const response = await api.get('/admin/category-discounts', params);
    // API client returns data.data, so response is already the data object
    return response?.discounts || response || [];
  },
  getCategoryDiscount: (id) => api.get(`/admin/category-discounts/${id}`),
  createCategoryDiscount: (data) => api.post('/admin/category-discounts', data),
  updateCategoryDiscount: (id, data) => api.put(`/admin/category-discounts/${id}`, data),
  deleteCategoryDiscount: (id) => api.delete(`/admin/category-discounts/${id}`),
  
  // Coupons
  listCoupons: async (params) => {
    const response = await api.get('/admin/coupons', params);
    // API client returns data.data, so response is already the data object
    return response?.coupons || response || [];
  },
  getCoupon: (id) => api.get(`/admin/coupons/${id}`),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
};

