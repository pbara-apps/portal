import axios from "axios";
import { API_URL } from "@/config/env";

const http = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token: string | null =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pbara-auth-session") || "{}")?.state
          ?.token || null
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

http.interceptors.response.use(
  (response) => response?.data,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/admin") || path.startsWith("/member")) {
        localStorage.removeItem("pbara-auth-session");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error?.response?.data ?? error);
  },
);

export default http;
