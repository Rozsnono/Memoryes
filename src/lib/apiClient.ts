// lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(async (config) => {
    const token = await localStorage.getItem("memoria_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;