import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { buildLoginPath } from "@/lib/auth/redirect";
import useCurrentUser from "@/hooks/useCurrentUser";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const token = useCurrentUser((s) => s.token);
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Verifying access…" />
      </div>
    );
  }

  if (!token) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={buildLoginPath(returnTo)} replace />;
  }

  return <>{children}</>;
}
