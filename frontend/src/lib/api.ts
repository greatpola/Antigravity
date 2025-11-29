import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const analyzeImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/analyze/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const generateCharacter = async (prompt: string, style: string, type: string = 'basic') => {
    const response = await api.post('/generate/character', { prompt, style, type });
    return response.data;
};

export const createCheckoutSession = async () => {
    const response = await api.post('/payments/create-checkout-session');
    return response.data;
};

export const getProjects = async () => {
    const response = await api.get('/projects/');
    return response.data;
};

export const getUserProfile = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};
