import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

const isJwtTokenExpired = (token: string) => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return true;
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp) {
      return false;
    }
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !isJwtTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    localStorage.removeItem("token");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export default api;