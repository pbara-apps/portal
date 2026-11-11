import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuArrowRight, LuPlus, LuTrash2 } from "react-icons/lu";
import { Link } from "react-router-dom";
import { Panel } from "@/components/shared/Panel";
import { PageHeader } from "@/components/shared/PageHeader";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentAccountSection } from "@/features/admin/components/settings/PaymentAccountSection";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetHeroStatsForSettings, useUpdateHeroStats } from "@/lib/api/settings";
import type { HeroStat } from "@/types";
import { ROLE_LABELS, isSuperAdmin } from "@/types/user";

const MAX_STATS = 4;

/** Same numbers the API serves when nothing has been saved yet. */
const DEFAULT_STATS: HeroStat[] = [
  { end: 21, label: "Active Chapters", suffix: "+" },
  { end: 500, label: "Total Ambassadors", suffix: "+" },
  { end: 14, label: "Years of Impact", suffix: "+" },
];

export default function SettingsAdminPage() {
  const user = useCurrentUser((s) => s.user);
  const superAdmin = isSuperAdmin(user?.role);
  const canManageHeroStats = user?.role === "super_admin" || user?.role === "admin";

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Settings" description="Association-wide settings for payments, the public homepage and admin access." />

      <PaymentAccountSection canEdit={superAdmin} />
      <HeroStatsSection canEdit={canManageHeroStats} />

      <Panel title="Admin access" description="Who can sign in to the admin portal, their roles and finance access.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            You're signed in as <span className="font-medium text-foreground">{user?.name ?? "Admin"}</span>
            {user?.role ? ` (${ROLE_LABELS[user.role]}${user.isFinance ? ", finance officer" : ""})` : ""}.{" "}
            {superAdmin
              ? "Manage accounts and roles on the Accounts page."
              : "Only super admins can give admin access or change roles."}
          </p>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/admin/profile">Your profile</Link>
            </Button>
            {superAdmin ? (
              <Button asChild>
                <Link to="/admin/accounts">
                  Open Accounts
                  <LuArrowRight size={15} aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function HeroStatsSection({ canEdit }: { canEdit: boolean }) {
  const { data: stats = [], isLoading, isError } = useGetHeroStatsForSettings(canEdit);

  return (
    <Panel title="Homepage statistics" description="The counters in the hero section of the public homepage. Up to four.">
      {!canEdit ? (
        <p className="text-sm text-muted">Only admins and super admins can change the homepage statistics.</p>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-danger">We couldn't load the homepage statistics. Refresh the page to try again.</p>
      ) : (
        <HeroStatsForm key={JSON.stringify(stats)} saved={stats} />
      )}
    </Panel>
  );
}

type Row = HeroStat & { key: number };

function HeroStatsForm({ saved }: { saved: HeroStat[] }) {
  const update = useUpdateHeroStats();
  const usingDefaults = saved.length === 0;
  // Stable keys so typing in a label doesn't remount the row.
  const [rows, setRows] = useState<Row[]>(() => (usingDefaults ? DEFAULT_STATS : saved).map((s, key) => ({ ...s, key })));
  const [nextKey, setNextKey] = useState(rows.length);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const change = (key: number, patch: Partial<HeroStat>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    if (patch.label !== undefined) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<number, string> = {};
    for (const r of rows) if (!r.label.trim()) found[r.key] = "Enter a label, or remove this stat.";
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    try {
      await update.mutateAsync({
        stats: rows.map((r) => ({ label: r.label.trim(), end: Math.max(0, Number(r.end) || 0), suffix: r.suffix.trim() || "+" })),
      });
      successToast("Homepage statistics updated.");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to update the statistics.", "Error");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {usingDefaults ? (
        <p className="text-sm text-muted">These are the built-in numbers the homepage shows until you save your own.</p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li
            key={r.key}
            aria-label={`Statistic ${i + 1}`}
            className="grid items-start gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_8rem_5rem_auto]"
          >
            <Input
              label="Label"
              placeholder="e.g. Active Chapters"
              value={r.label}
              error={errors[r.key] || undefined}
              onChange={(e) => change(r.key, { label: e.target.value })}
            />
            <Input
              label="Value"
              type="number"
              inputMode="numeric"
              min={0}
              value={String(r.end)}
              onChange={(e) => change(r.key, { end: Math.max(0, Number(e.target.value) || 0) })}
            />
            <Input label="Suffix" placeholder="+" maxLength={3} value={r.suffix} onChange={(e) => change(r.key, { suffix: e.target.value })} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${r.label || `statistic ${i + 1}`}`}
              disabled={rows.length <= 1}
              onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))}
              className="text-danger hover:bg-danger/[0.08] sm:mt-6"
            >
              <LuTrash2 size={16} aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={rows.length >= MAX_STATS}
          onClick={() => {
            setRows((prev) => [...prev, { key: nextKey, label: "", end: 0, suffix: "+" }]);
            setNextKey((k) => k + 1);
          }}
        >
          <LuPlus size={15} aria-hidden />
          Add statistic
        </Button>
        <Button type="submit" loading={update.isPending}>
          Save statistics
        </Button>
      </div>
    </form>
  );
}
