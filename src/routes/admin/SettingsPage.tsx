import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminPageCx,
  adminTableMinCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useProfile } from "@/lib/api/auth";
import {
  useGetExecutivesForSettings,
  useGetHeroStatsForSettings,
  useUpdateHeroStats,
  useUpdateExecutiveRole,
} from "@/lib/api/settings";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import {
  EXECUTIVE_ROLES,
  ROLE_LABELS,
  isSuperAdmin,
  type ExecutiveRole,
} from "@/types/user";
import type { HeroStat } from "@/types";

export default function SettingsAdminPage() {
  const { user } = useCurrentUser();
  useProfile(true);
  const superAdmin = isSuperAdmin(user?.role);
  const canManageHeroStats = user?.role === "super_admin" || user?.role === "admin";
  const { data: executives = [], isLoading, isError } =
    useGetExecutivesForSettings(superAdmin);
  const {
    data: heroStats = [],
    isLoading: isHeroStatsLoading,
    isError: isHeroStatsError,
  } = useGetHeroStatsForSettings(canManageHeroStats);
  const updateRole = useUpdateExecutiveRole();
  const updateHeroStats = useUpdateHeroStats();
  const [editableStats, setEditableStats] = useState<HeroStat[]>([]);

  useEffect(() => {
    setEditableStats(
      heroStats.length > 0
        ? heroStats
        : [
            { end: 21, label: "Active Chapters", suffix: "+" },
            { end: 500, label: "Total Ambassadors", suffix: "+" },
            { end: 14, label: "Years of Impact", suffix: "+" },
          ],
    );
  }, [heroStats]);

  const handleRoleChange = async (id: string, role: ExecutiveRole) => {
    try {
      await updateRole.mutateAsync({ id, role });
      successToast("Executive role updated.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to update role.",
        "Error",
      );
    }
  };

  const updateStat = (
    index: number,
    field: keyof HeroStat,
    value: string | number,
  ) => {
    setEditableStats((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "end"
                  ? Math.max(0, Number(value) || 0)
                  : String(value),
            }
          : item,
      ),
    );
  };

  const addStat = () => {
    setEditableStats((prev) => {
      if (prev.length >= 4) return prev;
      return [...prev, { label: "", end: 0, suffix: "+" }];
    });
  };

  const removeStat = (index: number) => {
    setEditableStats((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveHeroStats = async () => {
    const normalized = editableStats
      .map((item) => ({
        label: item.label.trim(),
        end: Number(item.end),
        suffix: item.suffix.trim() || "+",
      }))
      .filter((item) => item.label.length > 0);

    if (normalized.length === 0) {
      errorToast("At least one stat label is required.", "Validation");
      return;
    }

    try {
      await updateHeroStats.mutateAsync({ stats: normalized });
      successToast("Hero statistics updated.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to update hero statistics.",
        "Error",
      );
    }
  };

  const canSaveHeroStats =
    canManageHeroStats &&
    editableStats.length > 0 &&
    editableStats.every((item) => item.label.trim().length > 0);

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Settings"
        description="Manage your account and organization access controls."
      />

      <section className="rounded-2xl border border-text-dark/[0.05] bg-surface p-4 shadow-[0_1px_2px_rgba(27,36,82,0.04)] sm:p-6">
        <h2 className="text-base font-semibold text-primary">Your Account</h2>
        <p className="mt-1 text-sm text-text-muted">
          Signed in as {user?.name ?? "Admin"}
          {user?.email ? ` (${user.email})` : ""}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-primary/10 text-primary">
            {user?.role ? ROLE_LABELS[user.role] : "Admin"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <AccountDetail label="Full Name" value={user?.name} />
          <AccountDetail label="Email" value={user?.email} />
          <AccountDetail label="Phone" value={user?.phone} />
          <AccountDetail label="Office" value={user?.officeName} />
          <AccountDetail label="Church" value={user?.churchName} />
          <AccountDetail label="Chapter" value={user?.chapterName} />
          <AccountDetail
            label="Service Year"
            value={
              user?.startYear
                ? `${user.startYear}${user?.endYear ? ` - ${user.endYear}` : " - Present"}`
                : undefined
            }
          />
          <AccountDetail
            label="Account Status"
            value={user?.status ? user.status.toUpperCase() : undefined}
          />
        </div>
      </section>

      {superAdmin ? (
        <section className={adminTableSectionCx}>
          <div className="border-b border-text-dark/[0.05] px-4 py-5 sm:px-6">
            <h2 className="text-base font-semibold text-primary">
              Executive Role Assignment
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Assign access roles for each executive who can sign in to the admin
              portal.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner label="" />
            </div>
          ) : isError ? (
            <p className="py-16 text-center text-sm text-rose-600">
              Unable to load executives.
            </p>
          ) : (
            <div className={adminTableScrollCx}>
              <Table className={adminTableMinCx}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Executive</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Access Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-text-muted">
                        No executives found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    executives.map((exec) => (
                      <TableRow key={exec.id}>
                        <TableCell>
                          <p className="text-sm font-medium text-text-dark">{exec.name}</p>
                          <p className="text-xs text-text-muted">{exec.chapterName}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{exec.officeName || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-text-muted">{exec.email || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={exec.role ?? "admin"}
                            onValueChange={(role) => {
                              if (role !== exec.role) {
                                handleRoleChange(exec.id, role as ExecutiveRole);
                              }
                            }}
                            disabled={updateRole.isPending || exec.id === user?.id}
                          >
                            <SelectTrigger className="max-w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXECUTIVE_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-text-dark/10 bg-background/40 p-6">
          <h2 className="text-base font-semibold text-text-dark">Role Assignment</h2>
          <p className="mt-2 text-sm text-text-muted">
            Only super admins can assign roles to executives. Contact your
            organization super admin if you need access changes.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-text-dark/[0.05] bg-surface shadow-[0_1px_2px_rgba(27,36,82,0.04)]">
        <div className="border-b border-text-dark/[0.05] px-6 py-5">
          <h2 className="text-base font-semibold text-primary">Homepage Hero Statistics</h2>
          <p className="mt-1 text-sm text-text-muted">
            Control the statistic counters displayed on the hero section of the
            public homepage.
          </p>
        </div>

        {!canManageHeroStats ? (
          <p className="px-6 py-10 text-sm text-text-muted">
            Only Admins and Super Admins can manage homepage hero statistics.
          </p>
        ) : isHeroStatsLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label="" />
          </div>
        ) : isHeroStatsError ? (
          <p className="py-16 text-center text-sm text-rose-600">
            Unable to load hero statistics.
          </p>
        ) : (
          <div className="space-y-4 px-6 py-5">
            {editableStats.map((item, index) => (
              <div
                key={`${index}-${item.label}`}
                className="grid gap-3 rounded-xl border border-text-dark/10 p-4 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_auto_auto]"
              >
                <Input
                  label="Label"
                  placeholder="e.g. Active Chapters"
                  value={item.label}
                  onChange={(e) => updateStat(index, "label", e.target.value)}
                />
                <Input
                  label="Value"
                  type="number"
                  min={0}
                  value={String(item.end)}
                  onChange={(e) => updateStat(index, "end", e.target.value)}
                />
                <Input
                  label="Suffix"
                  placeholder="+"
                  value={item.suffix}
                  onChange={(e) => updateStat(index, "suffix", e.target.value)}
                />
                <Button
                  variant="ghost"
                  className="self-end text-rose-600 hover:text-rose-700"
                  onClick={() => removeStat(index)}
                  disabled={editableStats.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button variant="outline" onClick={addStat} disabled={editableStats.length >= 4}>
                Add Stat
              </Button>
              <Button
                className="bg-primary text-white"
                onClick={handleSaveHeroStats}
                loading={updateHeroStats.isPending}
                disabled={!canSaveHeroStats}
              >
                Save Hero Stats
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AccountDetail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-text-dark/[0.07] bg-background/30 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-text-dark">{value?.trim() || "—"}</p>
    </div>
  );
}
