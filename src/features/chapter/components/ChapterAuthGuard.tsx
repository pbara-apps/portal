import { Navigate, useLocation } from "react-router-dom";
import { useChapterSession } from "../store/useChapterSession";

/**
 * Protects chapter portal pages:
 * - not signed in → chapter login
 * - signed in with a one-time password → change-password screen first
 */
export function ChapterAuthGuard({ children }: { children: React.ReactNode }) {
  const token = useChapterSession((s) => s.token);
  const profile = useChapterSession((s) => s.profile);
  const { pathname } = useLocation();

  if (!token || !profile) return <Navigate to="/chapter/login" replace />;
  if (!profile.hasChangedPassword && pathname !== "/chapter/change-password") {
    return <Navigate to="/chapter/change-password" replace />;
  }
  return <>{children}</>;
}
