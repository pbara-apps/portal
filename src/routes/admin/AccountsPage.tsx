import { useMemo, useState } from "react";
import {
  LuBadgeCheck,
  LuEllipsisVertical,
  LuKeyRound,
  LuLink,
  LuSearch,
  LuShieldCheck,
  LuUserCheck,
  LuUserX,
} from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TemporaryPasswordDialog } from "@/components/shared/TemporaryPasswordDialog";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { CreateAccountDialog } from "@/features/admin/components/accounts/CreateAccountDialog";
import { LinkExecutiveDialog } from "@/features/admin/components/accounts/LinkExecutiveDialog";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminPageCx,
  adminTableMinCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { PORTAL_ROLE_LABELS, type CredentialDelivery, type PortalRole } from "@/features/chapter/types";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  type AdminAccount,
  useAdminAccounts,
  useResendAdminPassword,
  useUpdateAdminAccount,
} from "@/lib/api/accounts";
import { cn } from "@/lib/utils";
import { EXECUTIVE_ROLES, ROLE_LABELS, isSuperAdmin, type ExecutiveRole } from "@/types/user";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

/**
 * Accounts — who can sign in to the admin portal. Super admins only.
 * Accounts are created from an executive profile or by hand; a one-time
 * password is emailed and must be changed at first sign-in. Finance access
 * (Financial Secretary / Treasurer) needs a linked executive.
 */
export default function AccountsPage() {
  const { user } = useCurrentUser();
  const superAdmin = isSuperAdmin(user?.role);
  const { data: accounts = [], isLoading, isError } = useAdminAccounts(superAdmin);
  const update = useUpdateAdminAccount();
  const resend = useResendAdminPassword();
  const [createOpen, setCreateOpen] = useState(false);
  const [linking, setLinking] = useState<AdminAccount | null>(null);
  const [search, setSearch] = useState("");
  const [tempPassword, setTempPassword] = useState<{ name: string; email: string; password: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      [a.name, a.email, a.admin.executive?.office ?? "", ROLE_LABELS[a.admin.role]].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [accounts, search]);

  const counts = useMemo(
    () => ({
      active: accounts.filter((a) => a.admin.active && a.isActive).length,
      finance: accounts.filter((a) => a.admin.active && a.admin.isFinance).length,
      pending: accounts.filter((a) => a.admin.active && !a.hasChangedPassword).length,
    }),
    [accounts],
  );

  const report = (delivery: CredentialDelivery, account: { name: string; email: string }, sentText: string) => {
    if (delivery.temporaryPassword) setTempPassword({ ...account, password: delivery.temporaryPassword });
    else if (delivery.emailSent) successToast(sentText);
  };

  const save = async (
    account: AdminAccount,
    changes: { role?: ExecutiveRole; is_finance?: boolean; active?: boolean; executiveId?: string | null },
    message: string,
  ) => {
    try {
      await update.mutateAsync({ id: account.id, ...changes });
      successToast(message);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Error");
    }
  };

  const handleResend = async (account: AdminAccount) => {
    try {
      report(await resend.mutateAsync(account.id), account, `New one-time password emailed to ${account.email}.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  if (!superAdmin) {
    return (
      <div className={adminPageCx}>
        <AdminPageHeader title="Accounts" description="Who can sign in to the admin portal." />
        <section className="rounded-2xl border border-dashed border-text-dark/10 bg-background/40 p-6">
          <p className="text-sm text-text-muted">
            Only super admins can manage accounts. Contact your super admin if you need access changes.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Accounts"
        description="Who can sign in to the admin portal, their role and finance access. Sign-in details are emailed automatically."
        actionLabel="New account"
        onAction={() => setCreateOpen(true)}
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{counts.active} with access</Badge>
            <Badge variant="success">{counts.finance} finance</Badge>
            {counts.pending > 0 && <Badge className="bg-sky-100 text-sky-800">{counts.pending} awaiting first sign-in</Badge>}
          </>
        }
      />

      <section className={adminTableSectionCx}>
        <div className="flex flex-col gap-3 border-b border-text-dark/[0.05] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-text-muted">
            Finance access is for the Financial Secretary and Treasurer. It can only be turned on for accounts linked to an executive.
          </p>
          <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-text-dark/10 bg-background/70 px-3 sm:w-64">
            <LuSearch size={14} className="text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-rose-600">Unable to load accounts.</p>
        ) : (
          <div className={adminTableScrollCx}>
            <Table className={adminTableMinCx}>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Executive profile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Finance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-text-muted">
                      {accounts.length === 0 ? "No admin accounts yet." : "No accounts match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => {
                    const isMe = a.id === user?.id;
                    const removed = !a.admin.active || !a.isActive;
                    return (
                      <TableRow key={a.id} className={cn(removed && "opacity-60")}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {a.admin.executive?.image ? (
                              <img src={a.admin.executive.image} alt="" className="h-9 w-9 rounded-xl object-cover" />
                            ) : (
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                {initials(a.name)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-dark">
                                {a.name} {isMe && <span className="text-xs font-normal text-text-muted">(you)</span>}
                              </p>
                              <p className="truncate text-xs text-text-muted">{a.email}</p>
                              {a.chapterAccess?.active && (
                                <p className="mt-0.5 text-[11px] text-sky-700">
                                  Also {PORTAL_ROLE_LABELS[a.chapterAccess.role as PortalRole] ?? a.chapterAccess.role} in the chapter portal
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {a.admin.executive ? (
                            <div className="min-w-0">
                              <p className="truncate text-sm text-text-dark">{a.admin.executive.office || "Executive"}</p>
                              <p className="truncate text-[11px] text-text-muted">{a.admin.executive.church}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">Not linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={a.admin.role}
                            onValueChange={(role) =>
                              role !== a.admin.role &&
                              save(a, { role: role as ExecutiveRole }, `${a.name} is now ${ROLE_LABELS[role as ExecutiveRole]}.`)
                            }
                            disabled={isMe || removed || update.isPending}
                          >
                            <SelectTrigger className="h-9 max-w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXECUTIVE_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center" title={a.admin.executive ? undefined : "Link an executive first"}>
                            <Switch
                              checked={a.admin.isFinance}
                              disabled={!a.admin.executive || removed || update.isPending}
                              onCheckedChange={(v) =>
                                save(a, { is_finance: v }, v ? `${a.name} can now approve payments.` : `Finance access removed from ${a.name}.`)
                              }
                              aria-label="Finance officer"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {removed ? (
                            <Badge variant="destructive">Access removed</Badge>
                          ) : !a.hasChangedPassword ? (
                            <Badge className="bg-sky-100 text-sky-800">Awaiting first sign-in</Badge>
                          ) : (
                            <div>
                              <Badge variant="success">Active</Badge>
                              {a.lastLoginAt && (
                                <p className="mt-1 text-[11px] text-text-muted">Last sign-in {formatDate(a.lastLoginAt)}</p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Account actions" className="text-text-muted">
                                  <LuEllipsisVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleResend(a)} disabled={removed}>
                                  <LuKeyRound size={14} /> Send new one-time password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLinking(a)} disabled={removed}>
                                  <LuLink size={14} /> {a.admin.executive ? "Change linked executive" : "Link to an executive"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {a.admin.active ? (
                                  <DropdownMenuItem
                                    className="text-rose-600"
                                    disabled={isMe}
                                    onClick={() => save(a, { active: false }, `${a.name} can no longer sign in to the admin portal.`)}
                                  >
                                    <LuUserX size={14} /> Remove admin access
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => save(a, { active: true }, `Admin access restored for ${a.name}.`)}>
                                    <LuUserCheck size={14} /> Restore admin access
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: LuShieldCheck, title: "One account per person", text: "Each email has one login. Adding access to an existing email keeps their password." },
          { icon: LuKeyRound, title: "No typed passwords", text: "A one-time password is emailed. They must choose their own at first sign-in." },
          { icon: LuBadgeCheck, title: "Finance officers", text: "Only finance officers can verify or reject chapter payments." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-text-dark/[0.05] bg-surface p-4">
            <Icon size={18} className="text-gold" />
            <p className="mt-2 text-sm font-semibold text-primary">{title}</p>
            <p className="mt-1 text-xs text-text-muted">{text}</p>
          </div>
        ))}
      </div>

      <CreateAccountDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(result) => {
          setCreateOpen(false);
          const who = result.account;
          if (result.temporaryPassword) setTempPassword({ name: who.name, email: who.email, password: result.temporaryPassword });
          else if (!result.created) successToast(`${who.name} already had an account. Admin access was added and they were told by email.`);
          else successToast(`Account created. Sign-in details emailed to ${who.email}.`);
        }}
      />
      <LinkExecutiveDialog
        account={linking}
        onClose={() => setLinking(null)}
        onSave={async (executiveId) => {
          if (!linking) return;
          await save(linking, { executiveId }, executiveId ? "Executive linked." : "Executive unlinked.");
          setLinking(null);
        }}
        saving={update.isPending}
      />
      <TemporaryPasswordDialog info={tempPassword} onClose={() => setTempPassword(null)} />
    </div>
  );
}
