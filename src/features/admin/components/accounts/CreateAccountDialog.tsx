import { useEffect, useMemo, useState } from "react";
import { LuUserPlus, LuUsers } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { errorToast } from "@/components/shared/toast-notification";
import {
  type AdminAccount,
  useAvailableExecutives,
  useCreateAdminAccount,
} from "@/lib/api/accounts";
import { cn } from "@/lib/utils";
import { EXECUTIVE_ROLES, ROLE_LABELS, type ExecutiveRole } from "@/types/user";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Mode = "executive" | "manual";

/**
 * New admin account. Either pick an executive (name, email and phone come
 * from their profile; finance access possible) or enter details by hand.
 * No password is typed: a one-time password is generated and emailed.
 */
export function CreateAccountDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (result: { account: AdminAccount; created: boolean; temporaryPassword?: string }) => void;
}) {
  const { data: executives = [], isLoading } = useAvailableExecutives(open);
  const create = useCreateAdminAccount();
  const [mode, setMode] = useState<Mode>("executive");
  const [executiveId, setExecutiveId] = useState("");
  const [role, setRole] = useState<ExecutiveRole>("viewer");
  const [isFinance, setIsFinance] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("executive");
    setExecutiveId("");
    setRole("viewer");
    setIsFinance(false);
    setName("");
    setEmail("");
    setPhone("");
    setTouched(false);
  }, [open]);

  const exec = useMemo(() => executives.find((e) => e.id === executiveId), [executives, executiveId]);
  useEffect(() => {
    if (exec) setEmail(exec.email);
  }, [exec]);

  const errors = {
    executive: mode === "executive" && !executiveId ? "Pick an executive" : "",
    name: mode === "manual" && name.trim().length < 2 ? "Enter the full name" : "",
    email: EMAIL.test(email.trim()) ? "" : "An email is needed to send the sign-in details",
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async () => {
    setTouched(true);
    if (hasErrors) return;
    try {
      const result = await create.mutateAsync(
        mode === "executive"
          ? { executiveId, email: email.trim().toLowerCase(), role, is_finance: isFinance }
          : { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), role },
      );
      onCreated(result);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to create the account.", "Not created");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New admin account</DialogTitle>
          <DialogDescription>
            We'll email a one-time password. They choose their own password the first time they sign in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          {(
            [
              { id: "executive", icon: LuUsers, label: "From an executive" },
              { id: "manual", icon: LuUserPlus, label: "Someone else" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setTouched(false);
                if (id === "manual") {
                  setExecutiveId("");
                  setIsFinance(false);
                  setEmail("");
                }
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                mode === id ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-primary",
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {mode === "executive" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-dark">Executive</label>
              <Select value={executiveId || undefined} onValueChange={setExecutiveId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading…" : executives.length ? "Pick an executive" : "Every executive already has a login"} />
                </SelectTrigger>
                <SelectContent>
                  {executives.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                      {e.office ? ` · ${e.office}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched && errors.executive && <p className="text-xs text-rose-600">{errors.executive}</p>}
            </div>
          ) : (
            <>
              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={touched ? errors.name : undefined} />
              <Input label="Phone number (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </>
          )}

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={touched ? errors.email : undefined}
            placeholder={mode === "executive" && exec && !exec.email ? "This executive has no email yet" : "name@example.com"}
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-dark">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v as ExecutiveRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXECUTIVE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "executive" && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-text-dark/10 bg-background/40 p-4">
              <div>
                <p className="text-sm font-semibold text-text-dark">Finance officer</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  For the Financial Secretary and Treasurer. Lets them verify or reject chapter payments and manage dues.
                </p>
              </div>
              <Switch checked={isFinance} onCheckedChange={setIsFinance} aria-label="Finance officer" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} loading={create.isPending} className="bg-primary text-white">
            Create & send login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
