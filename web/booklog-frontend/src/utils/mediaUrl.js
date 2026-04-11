const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");

export const toAbsoluteMediaUrl = (url) => {
  if (!url || typeof url !== "string") {
    return url;
  }

  if (/^(data:|blob:|https?:\/\/)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${BACKEND_BASE_URL}${url}`;
  }

  return `${BACKEND_BASE_URL}/${url}`;
};
