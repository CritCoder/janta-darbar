import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyToken: () => api.get('/auth/verify'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Grievances API
export const grievancesAPI = {
  getAll: (params) => api.get('/grievances', { params }),
  getById: (id) => api.get(`/grievances/${id}`),
  create: (data) => api.post('/grievances', data),
  updateStatus: (id, data) => api.patch(`/grievances/${id}/status`, data),
  assignOfficer: (id, data) => api.patch(`/grievances/${id}/assign`, data),
  getTimeline: (id) => api.get(`/grievances/${id}/timeline`),
  getMedia: (id) => api.get(`/grievances/${id}/media`),
};

// Departments API
export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  getStats: (id, params) => api.get(`/departments/${id}/stats`, { params }),
  getOfficers: (id, params) => api.get(`/departments/${id}/officers`, { params }),
};

// Officers API
export const officersAPI = {
  getAll: (params) => api.get('/officers', { params }),
  getById: (id) => api.get(`/officers/${id}`),
  create: (data) => api.post('/officers', data),
  update: (id, data) => api.put(`/officers/${id}`, data),
  delete: (id) => api.delete(`/officers/${id}`),
  getStats: (id, params) => api.get(`/officers/${id}/stats`, { params }),
};

// Letters API
export const lettersAPI = {
  getAll: (params) => api.get('/letters', { params }),
  getById: (id) => api.get(`/letters/${id}`),
  create: (data) => api.post('/letters', data),
  sign: (id, data) => api.patch(`/letters/${id}/sign`, data),
  download: (id) => api.get(`/letters/${id}/download`, { responseType: 'blob' }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getHeatmap: (params) => api.get('/analytics/heatmap', { params }),
  getImpactStories: (params) => api.get('/analytics/impact-stories', { params }),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  exportData: (params) => api.get('/analytics/export', { params }),
};

// WhatsApp API
export const whatsappAPI = {
  sendMessage: (data) => api.post('/whatsapp/send', data),
  sendTemplate: (data) => api.post('/whatsapp/template', data),
  sendStatusUpdate: (data) => api.post('/whatsapp/status-update', data),
  sendReminder: (data) => api.post('/whatsapp/reminder', data),
  getTemplates: () => api.get('/whatsapp/templates'),
  test: (data) => api.post('/whatsapp/test', data),
};

// Upload API
export const uploadAPI = {
  uploadSingle: (formData) => api.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadMultiple: (formData) => api.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getGrievanceFiles: (id) => api.get(`/upload/grievance/${id}`),
  deleteFile: (id) => api.delete(`/upload/${id}`),
};

// Utility functions
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date, locale = 'mr-IN') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'अभी अभी';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} मिनिट पहले`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} घंटे पहले`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} दिन पहले`;
  
  return formatDate(date);
};

export default api;
