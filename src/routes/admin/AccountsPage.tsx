import { useState } from "react";
import {
  LuBadgeCheck,
  LuKeyRound,
  LuPlus,
  LuShieldCheck,
  LuShieldOff,
  LuSlidersHorizontal,
  LuUserCheck,
  LuUserX,
} from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { TemporaryPasswordDialog } from "@/components/shared/TemporaryPasswordDialog";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateAccountDrawer, EditAccessDrawer } from "@/features/admin/components/accounts/AccountDrawers";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { PORTAL_ROLE_LABELS, type CredentialDelivery, type PortalRole } from "@/features/chapter/types";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { type AdminAccount, useAdminAccounts, useResendAdminPassword, useUpdateAdminAccount } from "@/lib/api/accounts";
import { cn } from "@/lib/utils";
import { EXECUTIVE_ROLES, ROLE_LABELS, isSuperAdmin, type ExecutiveRole } from "@/types/user";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const hasAccess = (a: AdminAccount) => a.admin.active && a.isActive;

function AccountStatus({ a }: { a: AdminAccount }) {
  if (!hasAccess(a)) return <StatusPill tone="danger" label="Access removed" />;
  if (!a.hasChangedPassword) return <StatusPill tone="warning" label="Awaiting first sign-in" />;
  return <StatusPill tone="success" label="Active" />;
}

type Confirm = { kind: "remove" | "resend"; account: AdminAccount } | null;
type StatusFilter = "all" | "active" | "pending" | "removed";

/**
 * Accounts — who can sign in to the admin portal. Super admins only.
 * Accounts are created from an executive profile or by hand; a one-time
 * password is emailed and must be changed at first sign-in. Finance access
 * (Financial Secretary / Treasurer) needs a linked executive.
 */
export default function AccountsPage() {
  const user = useCurrentUser((s) => s.user);
  const superAdmin = isSuperAdmin(user?.role);
  const { data: accounts = [], isLoading, isError, refetch } = useAdminAccounts(superAdmin);
  const update = useUpdateAdminAccount();
  const resend = useResendAdminPassword();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [role, setRole] = useState<ExecutiveRole | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tempPassword, setTempPassword] = useState<{ name: string; email: string; password: string } | null>(null);

  const table = useClientTable({
    rows: accounts.filter(
      (a) =>
        (role === "all" || a.admin.role === role) &&
        (status === "all" ||
          (status === "removed" ? !hasAccess(a) : hasAccess(a) && (status === "pending") === !a.hasChangedPassword)),
    ),
    searchText: (a) => `${a.name} ${a.email} ${a.admin.executive?.office ?? ""} ${ROLE_LABELS[a.admin.role]}`,
    sortValue: (a, column) => (column === "role" ? ROLE_LABELS[a.admin.role] : a.name),
    resetKey: `${role}|${status}`,
  });
  const filtering = table.query.trim() !== "" || role !== "all" || status !== "all";

  const counts = {
    active: accounts.filter(hasAccess).length,
    finance: accounts.filter((a) => a.admin.active && a.admin.isFinance).length,
    pending: accounts.filter((a) => a.admin.active && !a.hasChangedPassword).length,
  };

  const report = (delivery: CredentialDelivery, account: { name: string; email: string }, sentText: string) => {
    if (delivery.temporaryPassword) setTempPassword({ ...account, password: delivery.temporaryPassword });
    else if (delivery.emailSent) successToast(sentText);
  };

  const setActive = async (a: AdminAccount, active: boolean) => {
    try {
      await update.mutateAsync({ id: a.id, active });
      successToast(active ? `Admin access restored for ${a.name}.` : `${a.name} can no longer sign in to the admin portal.`);
      setConfirm(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Error");
    }
  };

  const handleResend = async (a: AdminAccount) => {
    try {
      report(await resend.mutateAsync(a.id), a, `New one-time password emailed to ${a.email}.`);
      setConfirm(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  if (!superAdmin) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader title="Accounts" description="Who can sign in to the admin portal." />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={LuShieldOff}
            title="Only super admins can manage accounts"
            description="Contact your super admin if you need access changes."
          />
        </div>
      </div>
    );
  }

  const columns: DataTableColumn<AdminAccount>[] = [
    {
      id: "name",
      header: "Person",
      sortable: true,
      isRowHeader: true,
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9">
            {a.admin.executive?.image ? <AvatarImage src={a.admin.executive.image} alt="" /> : null}
            <AvatarFallback>{initials(a.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {a.name}
              {a.id === user?.id ? <span className="ml-1.5 text-xs font-normal text-muted">(you)</span> : null}
            </p>
            <p className="truncate text-xs text-muted">{a.email}</p>
            {a.chapterAccess?.active ? (
              <p className="truncate text-[11px] text-focus">
                Also {PORTAL_ROLE_LABELS[a.chapterAccess.role as PortalRole] ?? a.chapterAccess.role} in the chapter portal
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "executive",
      header: "Executive profile",
      hideBelow: "lg",
      cell: (a) =>
        a.admin.executive ? (
          <div className="min-w-0">
            <p className="truncate">{a.admin.executive.office || "Executive"}</p>
            <p className="truncate text-xs text-muted">{a.admin.executive.church}</p>
          </div>
        ) : (
          <span className="text-muted">Not linked</span>
        ),
    },
    {
      id: "role",
      header: "Role",
      sortable: true,
      cell: (a) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="whitespace-nowrap">{ROLE_LABELS[a.admin.role]}</span>
          {a.admin.isFinance ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-[#7a5f0c]">
              <LuBadgeCheck size={12} aria-hidden />
              Finance
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (a) => (
        <div>
          <AccountStatus a={a} />
          {hasAccess(a) && a.hasChangedPassword && a.lastLoginAt ? (
            <p className="mt-1 text-[11px] text-muted">Last sign-in {formatDate(a.lastLoginAt)}</p>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Accounts"
        description="Who can sign in to the admin portal, their role and finance access. Sign-in details are emailed automatically."
        meta={
          !isLoading && !isError ? (
            <p className="text-sm text-muted">
              <span className="font-medium tabular-nums text-foreground">{counts.active}</span> with access ·{" "}
              {counts.finance} finance
              {counts.pending ? ` · ${counts.pending} awaiting first sign-in` : ""}
            </p>
          ) : null
        }
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <LuPlus size={16} aria-hidden />
            New account
          </Button>
        }
      />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search name, email, office…" }}
          filters={
            <>
              <Select value={role} onValueChange={(v) => setRole(v as ExecutiveRole | "all")}>
                <SelectTrigger aria-label="Role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {EXECUTIVE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Awaiting first sign-in</SelectItem>
                  <SelectItem value="removed">Access removed</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />
        <DataTable
          aria-label="Admin accounts"
          columns={columns}
          rows={table.pageRows}
          getRowId={(a) => a.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load accounts."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          onRowAction={(a) => a.id !== user?.id && hasAccess(a) && setEditing(a)}
          rowActions={(a) => {
            const isMe = a.id === user?.id;
            const active = hasAccess(a);
            return (
              <RowActions
                label={`Actions for ${a.name}`}
                actions={[
                  active && !isMe && { label: "Edit access", icon: LuSlidersHorizontal, tone: "accent", onAction: () => setEditing(a) },
                  active && { label: "Send new one-time password", icon: LuKeyRound, tone: "warning", onAction: () => setConfirm({ kind: "resend", account: a }) },
                  a.admin.active
                    ? !isMe && { label: "Remove admin access", icon: LuUserX, danger: true, onAction: () => setConfirm({ kind: "remove", account: a }) }
                    : { label: "Restore admin access", icon: LuUserCheck, tone: "success", onAction: () => setActive(a, true) },
                ]}
              />
            );
          }}
          renderCard={(a) => (
            <div className={cn("space-y-2", !hasAccess(a) && "opacity-70")}>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9">
                  {a.admin.executive?.image ? <AvatarImage src={a.admin.executive.image} alt="" /> : null}
                  <AvatarFallback>{initials(a.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{a.name}</p>
                  <p className="truncate text-xs text-muted">{a.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-12 text-xs text-muted">
                <span>{ROLE_LABELS[a.admin.role]}</span>
                {a.admin.isFinance ? <span>· Finance</span> : null}
                <AccountStatus a={a} />
              </div>
            </div>
          )}
          emptyState={
            <EmptyState
              icon={LuShieldCheck}
              title={filtering ? "No accounts match your filters" : "No admin accounts yet"}
              action={
                filtering ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      table.setQuery("");
                      setRole("all");
                      setStatus("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          }
          summary={`${table.total} account${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={760}
        />
      </div>

      <ul className="grid gap-3 sm:grid-cols-3" aria-label="How accounts work">
        {[
          { icon: LuShieldCheck, title: "One account per person", text: "Each email has one login. Adding access to an existing email keeps their password." },
          { icon: LuKeyRound, title: "No typed passwords", text: "A one-time password is emailed. They choose their own at first sign-in." },
          { icon: LuBadgeCheck, title: "Finance officers", text: "Only finance officers can verify or reject chapter payments. They need a linked executive." },
        ].map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-[#8a6d12]">
              <Icon size={16} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <CreateAccountDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(result) => {
          const who = result.account;
          if (result.temporaryPassword) setTempPassword({ name: who.name, email: who.email, password: result.temporaryPassword });
          else if (!result.created) successToast(`${who.name} already had an account. Admin access was added and they were told by email.`);
          else successToast(`Account created. Sign-in details emailed to ${who.email}.`);
        }}
      />
      <EditAccessDrawer account={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        isOpen={confirm?.kind === "remove"}
        title="Remove admin access?"
        message={`${confirm?.account.name ?? "They"} will no longer be able to sign in to the admin portal. You can restore access later.`}
        confirmLabel="Remove access"
        loading={update.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && setActive(confirm.account, false)}
      />
      <ConfirmDialog
        isOpen={confirm?.kind === "resend"}
        tone="accent"
        title="Send a new one-time password?"
        message={`A new one-time password goes to ${confirm?.account.email ?? "their email"}. They'll choose their own password when they sign in with it.`}
        confirmLabel="Send password"
        loading={resend.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && handleResend(confirm.account)}
      />
      <TemporaryPasswordDialog info={tempPassword} onClose={() => setTempPassword(null)} />
    </div>
  );
}
