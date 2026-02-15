import axios from "axios";

const API_BASE_URL = "https://project-3-kdqc.onrender.com/api/v1";
const TOKEN_STORAGE_KEY = "token";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { TOKEN_STORAGE_KEY };
