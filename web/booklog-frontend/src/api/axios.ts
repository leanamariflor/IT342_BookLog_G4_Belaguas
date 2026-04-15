import axios from "axios";

const notifyAuthStateChanged = () => {
  window.dispatchEvent(new Event("auth-state-changed"));
};

const api = axios.create({
  baseURL: "http://localhost:8080/api",
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
    const skipAuthReset = Boolean((error?.config as any)?.skipAuthReset);
    if ((status === 401 || status === 403) && !skipAuthReset) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      notifyAuthStateChanged();
    }
    return Promise.reject(error);
  }
);

export default api;