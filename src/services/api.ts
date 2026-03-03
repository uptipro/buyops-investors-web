import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "https://buyops-backend-production-9b5d.up.railway.app";

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("buyops_user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
