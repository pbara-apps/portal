import { Navigate, useSearchParams } from "react-router-dom";
import { normalizeReturnPath } from "@/lib/auth/redirect";
import useCurrentUser from "@/hooks/useCurrentUser";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const token = useCurrentUser((s) => s.token);
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");

  if (token) {
    return <Navigate to={normalizeReturnPath(from)} replace />;
  }

  return <>{children}</>;
}
