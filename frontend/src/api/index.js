import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
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
            // Token expired or invalid
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        return api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getMe: () => api.get('/auth/me'),
    register: (data) => api.post('/auth/register', data),
    changePassword: (data) => api.post('/auth/change-password', data),
};

// Asrama API
export const asramaAPI = {
    list: (params) => api.get('/asrama', { params }),
    get: (id) => api.get(`/asrama/${id}`),
    create: (data) => api.post('/asrama', data),
    update: (id, data) => api.put(`/asrama/${id}`, data),
    delete: (id) => api.delete(`/asrama/${id}`),
};

// Kamar API
export const kamarAPI = {
    list: (params) => api.get('/kamar', { params }),
    get: (id) => api.get(`/kamar/${id}`),
    create: (data) => api.post('/kamar', data),
    update: (id, data) => api.put(`/kamar/${id}`, data),
    delete: (id) => api.delete(`/kamar/${id}`),
};

// Category API
export const categoryAPI = {
    list: (params) => api.get('/categories', { params }),
    get: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// Santri API (Phase 2)
export const santriAPI = {
    list: (params) => api.get('/santri', { params }),
    get: (id) => api.get(`/santri/${id}`),
    create: (data) => api.post('/santri', data),
    update: (id, data) => api.put(`/santri/${id}`, data),
    delete: (id) => api.delete(`/santri/${id}`),
    bulkImport: (formData) => api.post('/santri/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    uploadPhoto: (formData) => api.post('/santri/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Book API (Phase 2)
export const bookAPI = {
    list: (params) => api.get('/books', { params }),
    get: (id) => api.get(`/books/${id}`),
    create: (data) => api.post('/books', data),
    update: (id, data) => api.put(`/books/${id}`, data),
    delete: (id) => api.delete(`/books/${id}`),
    getBarcode: (id) => api.get(`/books/${id}/barcode`, { responseType: 'blob' }),
    bulkImport: (formData) => api.post('/books/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    uploadCover: (formData) => api.post('/books/upload-cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Borrowing API (Phase 3)
export const borrowingAPI = {
    list: (params) => api.get('/borrowings', { params }),
    get: (id) => api.get(`/borrowings/${id}`),
    create: (data) => api.post('/borrowings', data),
    return: (id, data) => api.post(`/borrowings/${id}/return`, data),
    renew: (id, data) => api.post(`/borrowings/${id}/renew`, data),
    payFine: (data) => api.post('/borrowings/fines/pay', data),
    getSantriActive: (santriId) => api.get(`/borrowings/santri/${santriId}/active`),
    delete: (id) => api.delete(`/borrowings/${id}`),
};

// Dashboard API (Phase 4)
// Dashboard API (Phase 4)
export const dashboardAPI = {
    getStats: (params) => api.get('/dashboard/stats', { params }),
};

// Settings API
export const settingsAPI = {
    list: () => api.get('/settings'),
    update: (data) => api.put('/settings', data),
    get: (key) => api.get(`/settings/${key}`),
};

// Reports API (Phase 4)
export const reportsAPI = {
    getBorrowings: (params) => api.get('/reports/borrowings', { params }),
    getReturns: (params) => api.get('/reports/returns', { params }),
    getBooks: (params) => api.get('/reports/books', { params }),
    getSantri: (params) => api.get('/reports/santri', { params }),
    exportExcel: (params) => api.get('/reports/export/excel', {
        params,
        responseType: 'blob'
    }),
    exportPdf: (params) => api.get('/reports/export/pdf', {
        params,
        responseType: 'blob'
    }),
};

export default api;
