import axios from "axios";

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: `${backendBaseUrl}/api`,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const skipAuthReset = Boolean(error?.config?.skipAuthReset);
    if ((status === 401 || status === 403) && !skipAuthReset) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-state-changed"));
    }
    return Promise.reject(error);
  }
);

export default api;
