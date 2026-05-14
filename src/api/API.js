import axios from 'axios';

// 1. Axios Instance update karein
const API = axios.create({
    // baseURL ko badal kar sirf '/api' karein
    // Taake Vite Proxy isay pakar kar backend IP par bhej sake
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// 2. Request Interceptor (Token lagane ke liye)
API.interceptors.request.use(
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

// 3. Response Interceptor (Error handle karne ke liye - e.g. 401 Unauthorized)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Agar token expire ho jaye toh logout karwa dein
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;