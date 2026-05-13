import axios from 'axios';
import { getIdToken } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

// Attach JWT from our backend (not Firebase token directly)
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('dispensa_jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    // Não recarrega na tela de login — deixa o catch mostrar o erro
    const isLoginEndpoint = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('dispensa_jwt');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const loginWithFirebaseToken = (idToken) =>
  api.post('/api/auth/login', { idToken }).then((r) => r.data);

export const updateFcmToken = (fcmToken) =>
  api.post('/api/auth/fcm-token', { fcmToken });

// Family
export const createFamily = (name, pin) =>
  api.post('/api/family', { name, pin }).then((r) => r.data);

export const joinFamily = (inviteCode, pin) =>
  api.post('/api/family/join', { inviteCode, pin }).then((r) => r.data);

export const getFamily = (id) =>
  api.get(`/api/family/${id}`).then((r) => r.data);

export const updateFamilySettings = (id, settings) =>
  api.put(`/api/family/${id}/settings`, settings).then((r) => r.data);

export const getFamilyActivity = (id) =>
  api.get(`/api/family/${id}/activity`).then((r) => r.data);

export const leaveFamily = (id) =>
  api.delete(`/api/family/${id}/leave`);

// Products
export const getProducts = (familyId) =>
  api.get(`/api/family/${familyId}/products`).then((r) => r.data.products);

export const getAlerts = (familyId) =>
  api.get(`/api/family/${familyId}/products/alerts`).then((r) => r.data.products);

export const getShoppingList = (familyId) =>
  api.get(`/api/family/${familyId}/products/shopping`).then((r) => r.data.items);

export const createProduct = (familyId, data) =>
  api.post(`/api/family/${familyId}/products`, data).then((r) => r.data.product);

export const updateProduct = (familyId, id, data) =>
  api.put(`/api/family/${familyId}/products/${id}`, data).then((r) => r.data.product);

export const deleteProduct = (familyId, id) =>
  api.delete(`/api/family/${familyId}/products/${id}`);

// Barcode
export const lookupBarcode = (code) =>
  api.get(`/api/barcode/${code}`).then((r) => r.data);
