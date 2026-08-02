import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const INTEGRITY_SECRET = process.env.REACT_APP_INTEGRITY_SECRET || '';

const hmac = (payload) =>
  CryptoJS.HmacSHA256(payload, INTEGRITY_SECRET).toString(CryptoJS.enc.Hex);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Outgoing: attach JWT + sign request body
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const methods = ['post', 'put', 'patch'];
  const method = config.method?.toLowerCase();
  if (methods.includes(method)) {
    const data = config.data !== undefined ? config.data : {};
    const isFormData =
      typeof FormData !== 'undefined' &&
      (data instanceof FormData ||
        (data && data.constructor && data.constructor.name === 'FormData'));

    if (isFormData) {
      // Let Axios set the multipart/form-data Content-Type with boundary.
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      // Serialize to string if not already, matching what the backend will JSON.parse then re-stringify
      const bodyObj = typeof data === 'string' ? JSON.parse(data) : data;
      const payload = JSON.stringify(bodyObj);
      config.headers['X-Request-Signature'] = hmac(payload);
      config.headers['Content-Type'] = 'application/json';
      config.data = payload; // ensure body sent matches what we signed
    }
  }

  return config;
});

// Incoming: verify response signature + normalize errors
api.interceptors.response.use(
  (response) => {
    const signature = response.headers['x-response-signature'];
    if (signature && response.data) {
      const payload = JSON.stringify(response.data);
      const expected = hmac(payload);
      if (signature !== expected) {
        return Promise.reject({ displayMessage: 'Response integrity check failed. Data may have been tampered.' });
      }
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    return Promise.reject({ ...error, displayMessage: message });
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  getAdminUsers: () => api.get('/auth/users'),
  createAdminUser: (data) => api.post('/auth/users', data),
  updateUserRole: (id, data) => api.put(`/auth/users/${id}/role`, data),
  updateUserStatus: (id, data) => api.put(`/auth/users/${id}/status`, data),
  updateUserPermissions: (id, data) => api.put(`/auth/users/${id}/permissions`, data),
  toggleUserActive: (id) => api.put(`/auth/users/${id}/toggle-active`),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  getLogs: () => api.get('/auth/logs'),
  addToWishlist: (productId) => api.post('/auth/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/auth/wishlist/${productId}`)
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getRecommendations: (params) => api.get('/products/recommendations', { params }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  toggleAvailability: (id) => api.patch(`/products/${id}/toggle-availability`),
  sell: (id, data) => api.post(`/products/${id}/sell`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getSoldProducts: (params) => api.get('/products/sold', { params }),
  getSoldProduct: (id) => api.get(`/products/sold/${id}`),
  updateSoldProductCustomer: (id, data) => api.patch(`/products/sold/${id}/customer`, data),
  deleteSoldProduct: (id) => api.delete(`/products/sold/${id}`),
  restoreSoldProduct: (id) => api.patch(`/products/sold/${id}/restore`),
  verifyUOO: (productNumber, uooNumber) => api.get(`/products/verify-uoo?productNumber=${productNumber}&uooNumber=${uooNumber}`)
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOne: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, data) => api.put(`/orders/${id}`, data),
  getStats: () => api.get('/orders/stats')
};

export const dropAPI = {
  getAll: (params) => api.get('/drops', { params }),
  getOne: (id) => api.get(`/drops/${id}`),
  create: (data) => api.post('/drops', data),
  update: (id, data) => api.put(`/drops/${id}`, data),
  delete: (id) => api.delete(`/drops/${id}`),
  subscribe: (id) => api.post(`/drops/${id}/subscribe`),
  launch: (id) => api.post(`/drops/${id}/launch`)
};

export const couponAPI = {
  validate: (data) => api.post('/coupons/validate', data),
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`)
};

export const cmsAPI = {
  getActiveBanners: () => api.get('/cms/banners/active'),
  getAllBanners: () => api.get('/cms/banners'),
  createBanner: (data) => api.post('/cms/banners', data),
  updateBanner: (id, data) => api.put(`/cms/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/cms/banners/${id}`),
  subscribeNewsletter: (email) => api.post('/cms/newsletter', { email }),
  getAnnouncement: () => api.get('/cms/announcement'),
  updateAnnouncement: (data) => api.put('/cms/announcement', data),
  getHeroImage: () => api.get('/cms/hero-image'),
  updateHeroImage: (data) => api.put('/cms/hero-image', data)
};

export const uploadAPI = {
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return api.post('/upload', formData);
  }
};

export const analyticsAPI = {
  trackEvent: (data) => api.post('/analytics/event', data),
  getSummary: (days = 30) => api.get(`/analytics/summary?days=${days}`),
  getUnknownIPs: (days = 7) => api.get(`/analytics/unknown-ips?days=${days}`)
};

export const reportAPI = {
  downloadSalesReport: (period = 'monthly', params = {}) =>
    api.get('/reports/excel', { params: { period, ...params }, responseType: 'blob' }),
  getCustomerRanking: (params = {}) =>
    api.get('/reports/customer-ranking', { params }),
  downloadCustomerRankingExcel: () =>
    api.get('/reports/customer-ranking/export', { responseType: 'blob' }),
  downloadSingleCustomerExcel: (phone) =>
    api.get('/reports/customer-excel', { params: { phone }, responseType: 'blob' })
};

export default api;
