import axios from "axios";

// Create a custom axios instance for the backend routes
const backendApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || "https://musix.trackloco.site/api",
});

// Intercept requests to add the JWT token
backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("musix_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default backendApi;
