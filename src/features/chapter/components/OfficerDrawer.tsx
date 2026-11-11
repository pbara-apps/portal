import { useEffect, useMemo, useState } from "react";
import { LuCheck, LuSearch } from "react-icons/lu";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useChapterMembers } from "../api/members";
import { preventEnterSubmit } from "../lib/form-keys";
import type { PortalAccount } from "../types";
import { MemberAvatar } from "./MemberAvatar";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type OfficerDetails = { memberId: string; email: string; phone: string };

/**
 * Picks a chapter's President or Secretary from its members, then their
 * email (for the login) and phone. Only current members can be picked.
 */
export function OfficerDrawer({
  open,
  title,
  description,
  chapterId,
  current,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  description: string;
  chapterId: string;
  current: (PortalAccount & { memberId?: string | null }) | null;
  saving: boolean;
  onClose: () => void;
  onSave: (details: OfficerDetails) => void;
}) {
  const { data: members = [], isLoading } = useChapterMembers({ chapterId, view: "all" }, open && Boolean(chapterId));
  const [search, setSearch] = useState("");
  const [memberId, setMemberId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setMemberId(current?.memberId ?? "");
    setEmail(current?.email ?? "");
    setPhone(current?.phone ?? "");
    setTouched(false);
  }, [open, current]);

  const eligible = useMemo(
    () => members.filter((m) => m.status === "active" || m.status === "pending"),
    [members],
  );
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter(
      (m) => m.fullName.toLowerCase().includes(q) || (m.memberId ?? "").toLowerCase().includes(q),
    );
  }, [eligible, search]);
  const picked = eligible.find((m) => m.id === memberId);

  const errors = {
    member: memberId ? "" : "Pick the member",
    email: EMAIL.test(email.trim()) ? "" : "Enter a valid email address",
    phone: phone.trim().length >= 7 || (picked?.phone ?? "").length >= 7 ? "" : "Enter a phone number",
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (!hasErrors) onSave({ memberId, email: email.trim().toLowerCase(), phone: phone.trim() });
  };

  return (
    <FormDrawer
      open={open}
      title={title}
      description={description}
      onSubmit={submit}
      onCancel={onClose}
      submitting={saving}
      submitLabel="Save & send login"
    >
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Member</p>
        <label className="mb-2 flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3">
          <LuSearch size={14} className="text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={preventEnterSubmit}
            aria-label="Search members"
            placeholder="Search by name or member ID…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : visible.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted">
              {eligible.length === 0 ? "This chapter has no members yet. Add members first." : "No members match."}
            </p>
          ) : (
            visible.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={m.id === memberId}
                onClick={() => {
                  setMemberId(m.id);
                  if (!phone && m.phone) setPhone(m.phone);
                }}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-separator px-3 py-2 text-left last:border-0 hover:bg-surface-secondary",
                  m.id === memberId && "bg-primary/5",
                )}
              >
                <MemberAvatar photo={m.photo} name={m.fullName} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{m.fullName}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {m.memberId ?? "Awaiting approval"}
                    {m.rank ? ` · ${m.rank.name}` : ""}
                  </span>
                </span>
                {m.id === memberId && <LuCheck size={16} className="text-primary" aria-hidden />}
              </button>
            ))
          )}
        </div>
        {touched && errors.member && <p className="mt-1 text-xs text-danger">{errors.member}</p>}
      </div>

      <Input
        label="Email address (for their login)"
        type="email"
        value={email}
        error={touched ? errors.email || undefined : undefined}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Phone number"
        type="tel"
        value={phone}
        placeholder={picked?.phone ?? ""}
        error={touched ? errors.phone || undefined : undefined}
        onChange={(e) => setPhone(e.target.value)}
      />
    </FormDrawer>
  );
}
