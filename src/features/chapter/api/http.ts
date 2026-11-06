import axios from "axios";
import { API_URL } from "@/config/env";
import { useAccount } from "@/lib/auth/session";
import { useChapterSession } from "../store/useChapterSession";

/**
 * HTTP client for the chapter portal API (/chapter-portal).
 *
 * - Sends the chapter session token (never the admin token).
 * - 401 → session ended: sign out of the chapter portal and go to /login.
 * - 403 with PASSWORD_CHANGE_REQUIRED → go to the first-password screen.
 * - Resolves with the response body's `data`-carrying object, like the admin client.
 */
const chapterHttp = axios.create({
  baseURL: `${API_URL}/chapter-portal`,
  headers: { Accept: "application/json" },
});

chapterHttp.interceptors.request.use((config) => {
  const token = useChapterSession.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

chapterHttp.interceptors.response.use(
  (response) => response?.data,
  (error) => {
    const status = error?.response?.status;
    const body = error?.response?.data;
    const isLogin = String(error?.config?.url ?? "").includes("auth/login");

    if (status === 401 && !isLogin) {
      useChapterSession.getState().signOut();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    if (status === 403 && body?.code === "PASSWORD_CHANGE_REQUIRED") {
      useAccount.getState().set({ ...useAccount.getState(), hasChangedPassword: false });
      if (!window.location.pathname.startsWith("/change-password")) {
        window.location.assign("/change-password");
      }
    }
    return Promise.reject(body ?? error);
  },
);

export default chapterHttp;
