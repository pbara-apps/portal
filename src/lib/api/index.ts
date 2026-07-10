import axios from "axios";
import { API_URL } from "@/config/env";
import useCurrentUser from "@/hooks/useCurrentUser";
import { currentReturnPath } from "@/lib/auth/redirect";
import { useSession } from "@/store/useSession";

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

function isAuthLoginRequest(url?: string) {
  if (!url) return false;
  return url.includes("auth/login");
}

function isProtectedAppRoute() {
  const path = window.location.pathname;
  return path.startsWith("/admin") || path.startsWith("/member");
}

http.interceptors.response.use(
  (response) => response?.data,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const requestUrl = error.config?.url as string | undefined;
      const hadToken = Boolean(useCurrentUser.getState().token);

      if (
        hadToken &&
        isProtectedAppRoute() &&
        !isAuthLoginRequest(requestUrl) &&
        !window.location.pathname.startsWith("/login")
      ) {
        useCurrentUser.getState().removeCurrentUser();
        useSession.getState().markSessionExpired(currentReturnPath());
      }
    }
    return Promise.reject(error?.response?.data ?? error);
  },
);

export default http;
