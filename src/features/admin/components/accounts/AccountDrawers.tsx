import { useState } from "react";
import { ChoiceCards } from "@/components/shared/ChoiceCards";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type AdminAccount,
  useAvailableExecutives,
  useCreateAdminAccount,
  useUpdateAdminAccount,
} from "@/lib/api/accounts";
import { cn } from "@/lib/utils";
import { EXECUTIVE_ROLES, ROLE_LABELS, type ExecutiveRole } from "@/types/user";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NONE = "__none__";

function RoleSelect({ value, onChange, disabled }: { value: ExecutiveRole; onChange: (r: ExecutiveRole) => void; disabled?: boolean }) {
  return (
    <Select label="Role" value={value} onValueChange={(v) => onChange(v as ExecutiveRole)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EXECUTIVE_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Finance officer toggle with its explanation. Needs a linked executive. */
function FinanceToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 rounded-xl border border-border p-4", disabled && "opacity-60")}>
      <div>
        <p id="finance-label" className="text-sm font-medium text-foreground">
          Finance officer
        </p>
        <p id="finance-hint" className="mt-0.5 text-xs text-muted">
          {disabled
            ? "Link an executive profile first. Finance access is for the Financial Secretary and Treasurer."
            : "For the Financial Secretary and Treasurer: verify or reject chapter payments and manage dues."}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-labelledby="finance-label"
        aria-describedby="finance-hint"
      />
    </div>
  );
}

type CreateResult = { account: AdminAccount; created: boolean; temporaryPassword?: string };
type Mode = "executive" | "manual";
type CreateErrors = Partial<Record<"executive" | "name" | "email", string>>;

/**
 * New admin account. Either pick an executive (name, email and phone come
 * from their profile; finance access possible) or enter details by hand.
 * No password is typed: a one-time password is generated and emailed.
 */
export function CreateAccountDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreateResult) => void;
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
  const [errors, setErrors] = useState<CreateErrors>({});
  const clear = (key: keyof CreateErrors) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const close = () => {
    setMode("executive");
    setExecutiveId("");
    setRole("viewer");
    setIsFinance(false);
    setName("");
    setEmail("");
    setPhone("");
    setErrors({});
    onClose();
  };

  const pickExecutive = (id: string) => {
    setExecutiveId(id);
    // Prefill from the profile; the admin can still correct it.
    setEmail(executives.find((e) => e.id === id)?.email ?? "");
    setErrors({});
  };

  const submit = async () => {
    const found: CreateErrors = {};
    if (mode === "executive" && !executiveId) found.executive = "Choose the executive this login is for.";
    if (mode === "manual" && name.trim().length < 2) found.name = "Enter their full name.";
    if (!EMAIL.test(email.trim())) found.email = "Enter a valid email. The sign-in details are sent there.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      const result = await create.mutateAsync(
        mode === "executive"
          ? { executiveId, email: email.trim().toLowerCase(), role, is_finance: isFinance }
          : { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), role },
      );
      onCreated(result);
      close();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to create the account.", "Not created");
    }
  };

  const selectedExec = executives.find((e) => e.id === executiveId);

  return (
    <FormDrawer
      open={open}
      title="New admin account"
      description="We email a one-time password. They choose their own the first time they sign in."
      onSubmit={submit}
      onCancel={close}
      submitting={create.isPending}
      submitLabel="Create and send login"
    >
      <ChoiceCards
        label="Who is this for?"
        name="account-mode"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setErrors({});
          setExecutiveId("");
          setIsFinance(false);
          setEmail("");
        }}
        options={[
          { value: "executive", label: "An executive", hint: "Details come from their profile" },
          { value: "manual", label: "Someone else", hint: "Enter their details" },
        ]}
      />

      {mode === "executive" ? (
        <Select
          label="Executive"
          value={executiveId}
          onValueChange={pickExecutive}
          disabled={isLoading || executives.length === 0}
          error={errors.executive}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={isLoading ? "Loading…" : executives.length ? "Choose an executive" : "Every executive already has a login"}
            />
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
      ) : (
        <>
          <Input
            label="Full name"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              clear("name");
            }}
            autoFocus
          />
          <Input label="Phone number (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </>
      )}

      <Input
        label="Email address"
        type="email"
        value={email}
        error={errors.email}
        placeholder={selectedExec && !selectedExec.email ? "This executive has no email yet" : "name@example.com"}
        onChange={(e) => {
          setEmail(e.target.value);
          clear("email");
        }}
      />
      <RoleSelect value={role} onChange={setRole} />
      {mode === "executive" ? <FinanceToggle checked={isFinance} onChange={setIsFinance} disabled={!executiveId} /> : null}
    </FormDrawer>
  );
}

/**
 * Edit an account's role, linked executive and finance access in one save.
 * The API links the executive before checking finance, so both can change together.
 */
export function EditAccessDrawer({ account, onClose }: { account: AdminAccount | null; onClose: () => void }) {
  return account ? <EditAccessForm key={account.id} account={account} onClose={onClose} /> : null;
}

function EditAccessForm({ account, onClose }: { account: AdminAccount; onClose: () => void }) {
  const { data: executives = [], isLoading } = useAvailableExecutives(true);
  const update = useUpdateAdminAccount();
  const [role, setRole] = useState<ExecutiveRole>(account.admin.role);
  const [executiveId, setExecutiveId] = useState(account.admin.executiveId ?? NONE);
  const [isFinance, setIsFinance] = useState(account.admin.isFinance);
  const linked = executiveId !== NONE;
  const current = account.admin.executive;

  const changes = {
    ...(role !== account.admin.role ? { role } : {}),
    ...((linked ? executiveId : null) !== account.admin.executiveId ? { executiveId: linked ? executiveId : null } : {}),
    ...((linked && isFinance) !== account.admin.isFinance ? { is_finance: linked && isFinance } : {}),
  };
  const dirty = Object.keys(changes).length > 0;

  const save = async () => {
    if (!dirty) return onClose();
    try {
      await update.mutateAsync({ id: account.id, ...changes });
      successToast(`Access updated for ${account.name}.`);
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Error");
    }
  };

  return (
    <FormDrawer
      open
      title="Edit access"
      description={`${account.name} · ${account.email}`}
      onSubmit={save}
      onCancel={onClose}
      submitting={update.isPending}
      submitDisabled={!dirty}
      submitLabel="Save changes"
    >
      <RoleSelect value={role} onChange={setRole} />
      <div className="space-y-1.5">
        <Select
          label="Linked executive profile"
          value={executiveId}
          onValueChange={(v) => {
            setExecutiveId(v);
            if (v === NONE) setIsFinance(false);
          }}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an executive" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Not linked</SelectItem>
            {current && account.admin.executiveId ? (
              <SelectItem value={account.admin.executiveId}>
                {`${current.name}${current.office ? ` · ${current.office}` : ""} (current)`}
              </SelectItem>
            ) : null}
            {executives.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
                {e.office ? ` · ${e.office}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted">Unlinking also removes finance access.</p>
      </div>
      <FinanceToggle checked={linked && isFinance} onChange={setIsFinance} disabled={!linked} />
    </FormDrawer>
  );
}
