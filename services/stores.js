import { api } from '../lib/api-client';

export const storeService = {
  list: async (params) => {
    const response = await api.get('/admin/stores', params);
    console.log('storeService.list response:', response);
    console.log('storeService.list response type:', typeof response);
    console.log('storeService.list response keys:', response ? Object.keys(response) : 'null');
    // API returns: { success: true, data: { stores: [...], pagination: {...} } }
    // api-client returns: data.data if exists, otherwise data
    // So response should be: { stores: [...], pagination: {...} }
    if (response?.stores && Array.isArray(response.stores)) {
      console.log('Found stores in response.stores:', response.stores.length);
      return response.stores;
    } else if (response?.data?.stores && Array.isArray(response.data.stores)) {
      console.log('Found stores in response.data.stores:', response.data.stores.length);
      return response.data.stores;
    } else if (Array.isArray(response)) {
      console.log('Response is direct array:', response.length);
      return response;
    }
    console.warn('Unexpected response format in storeService.list:', JSON.stringify(response, null, 2));
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

