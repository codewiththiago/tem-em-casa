import axios from 'axios';
import { getIdToken } from './firebase';
import { useStore } from '../store/useStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('dispensa_jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Singleton promise prevents multiple concurrent 401s from triggering parallel refreshes.
let refreshPromise = null;

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const isLoginEndpoint = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginEndpoint && !err.config?._retry) {
      err.config._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = getIdToken()
            .then(async (idToken) => {
              if (!idToken) throw new Error('No Firebase token available');
              const { data } = await axios.post(`${BASE_URL}/api/auth/login`, { idToken });
              localStorage.setItem('dispensa_jwt', data.token);
              return data.token;
            })
            .finally(() => { refreshPromise = null; });
        }
        const token = await refreshPromise;
        err.config.headers = { ...err.config.headers, Authorization: `Bearer ${token}` };
        return api(err.config);
      } catch {
        localStorage.removeItem('dispensa_jwt');
        useStore.getState().clearAuth();
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const loginWithFirebaseToken = (idToken, displayName = null) =>
  api.post('/api/auth/login', { idToken, displayName }).then((r) => r.data);

export const updateFcmToken = (fcmToken) =>
  api.post('/api/auth/fcm-token', { fcmToken });

export const updateProfile = (name) =>
  api.put('/api/auth/profile', { name }).then((r) => r.data);

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

export const fetchServerAlerts = (familyId) =>
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
