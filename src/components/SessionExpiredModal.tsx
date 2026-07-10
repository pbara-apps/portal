import { useNavigate } from "react-router-dom";
import { LuLogIn } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildLoginPath } from "@/lib/auth/redirect";
import { useSession } from "@/store/useSession";

export function SessionExpiredModal() {
  const navigate = useNavigate();
  const expired = useSession((s) => s.expired);
  const returnTo = useSession((s) => s.returnTo);
  const clearSessionExpired = useSession((s) => s.clearSessionExpired);

  const handleGoToLogin = () => {
    const loginPath = buildLoginPath(returnTo);
    clearSessionExpired();
    navigate(loginPath, { replace: true });
  };

  return (
    <Dialog open={expired} onOpenChange={() => undefined}>
      <DialogContent
        hideClose
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Session expired</DialogTitle>
          <DialogDescription>
            Your session has expired for security reasons. Please sign in again to
            continue where you left off.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleGoToLogin} className="w-full sm:w-auto">
            <LuLogIn size={16} />
            Go to login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
