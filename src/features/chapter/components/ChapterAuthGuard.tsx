import { Navigate, useLocation } from "react-router-dom";
import { useAccount } from "@/lib/auth/session";
import { useChapterSession } from "../store/useChapterSession";

/**
 * Protects chapter portal pages:
 * - not signed in (or a session from before the shared sign-in) → /login
 * - signed in with a one-time password → choose a password first
 */
export function ChapterAuthGuard({ children }: { children: React.ReactNode }) {
  const token = useChapterSession((s) => s.token);
  const profile = useChapterSession((s) => s.profile);
  const accountToken = useAccount((s) => s.token);
  const { pathname } = useLocation();

  if (!token || !profile || token !== accountToken) {
    const from = encodeURIComponent(pathname);
    return <Navigate to={pathname === "/chapter" ? "/login" : `/login?from=${from}`} replace />;
  }
  if (!profile.hasChangedPassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}
