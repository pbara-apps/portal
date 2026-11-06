import { Navigate, useSearchParams } from "react-router-dom";
import { normalizeReturnPath } from "@/lib/auth/redirect";
import { landingPath, useAccount } from "@/lib/auth/session";

/** Sign-in pages: someone already signed in goes straight to where they belong. */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");

  if (account.token) {
    return <Navigate to={landingPath(account, from ? normalizeReturnPath(from) : null)} replace />;
  }

  return <>{children}</>;
}
