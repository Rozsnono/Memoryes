// lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
    // Use your production Vercel URL
    baseURL:  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
    // CRITICAL: This must be true to work with Access-Control-Allow-Credentials
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("memoria_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;