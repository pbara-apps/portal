import { Navigate } from "react-router-dom";
import useCurrentUser from "@/hooks/useCurrentUser";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const token = useCurrentUser((s) => s.token);
  if (token) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
