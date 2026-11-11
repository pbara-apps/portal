import { Skeleton } from "@heroui/react";
import { LuBadgeCheck, LuPencil, LuRefreshCw } from "react-icons/lu";
import { DetailItem, DetailList } from "@/components/shared/DetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useProfile } from "@/lib/api/auth";
import { useDrawer } from "@/store/useDrawer";
import type { UserType } from "@/types/user";
import { ROLE_LABELS, canManageDirectorDesk, canWriteAdminContent } from "@/types/user";

const STATUS: Record<NonNullable<UserType["status"]>, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  completed: { label: "Service completed", tone: "neutral" },
};

function initials(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? `${parts[0][0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() : "AD";
}

const serviceYears = (u?: UserType | null) =>
  u?.startYear ? `${u.startYear}${u.endYear ? ` – ${u.endYear}` : " – present"}` : null;

const clean = (v?: string | null) => (v && v.trim() && v !== "—" ? v : null);

/** Your own executive profile and what you can do in the admin portal. */
export default function AdminProfilePage() {
  const storedUser = useCurrentUser((s) => s.user);
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { data: profile, isLoading, isError, refetch, isRefetching } = useProfile(true);
  const user = profile ?? storedUser;
  const canWrite = canWriteAdminContent(user?.role);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Your profile"
        description="Your account and executive profile from the association directory."
        actions={
          user ? (
            <Button type="button" onClick={() => openDrawer("edit-profile", { body: user })}>
              <LuPencil size={15} aria-hidden />
              Edit profile
            </Button>
          ) : null
        }
      />

      {isLoading && !user ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      ) : isError && !user ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            tone="danger"
            title="We couldn't load your profile"
            action={
              <Button type="button" variant="outline" onClick={() => refetch()} loading={isRefetching}>
                <LuRefreshCw size={15} aria-hidden />
                Try again
              </Button>
            }
          />
        </div>
      ) : user ? (
        <>
          <section
            aria-label="Profile summary"
            className="relative overflow-hidden rounded-xl bg-sidebar p-6 text-white shadow-[var(--surface-shadow)] sm:p-7"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.16),transparent)]"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              {user.image ? (
                <img src={user.image} alt="" className="size-20 shrink-0 rounded-full object-cover ring-4 ring-white/10" />
              ) : (
                <span
                  aria-hidden
                  className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gold text-2xl font-semibold text-primary ring-4 ring-white/10"
                >
                  {initials(user.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h2>
                <p className="mt-1 text-sm text-white/70">
                  {[clean(user.officeName), clean(user.rankName)].filter(Boolean).join(" · ") || "No office assigned"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium">
                    {user.role ? ROLE_LABELS[user.role] : "Admin"}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium">
                    {canWrite ? "Can edit content" : "Read-only"}
                  </span>
                  {user.isFinance ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <LuBadgeCheck size={12} aria-hidden />
                      Finance officer
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Contact">
              <DetailList>
                <DetailItem label="Full name">{clean(user.name)}</DetailItem>
                <DetailItem label="Email">{clean(user.email)}</DetailItem>
                <DetailItem label="Phone">{clean(user.phone)}</DetailItem>
              </DetailList>
            </Panel>
            <Panel title="Office and assignment">
              <DetailList>
                <DetailItem label="Office">{clean(user.officeName)}</DetailItem>
                <DetailItem label="Rank">{clean(user.rankName)}</DetailItem>
                <DetailItem label="Public title">{clean(user.title)}</DetailItem>
                <DetailItem label="Church">{clean(user.churchName)}</DetailItem>
                <DetailItem label="Chapter">{clean(user.chapterName)}</DetailItem>
                <DetailItem label="Service period">{serviceYears(user)}</DetailItem>
              </DetailList>
            </Panel>
            <Panel title="Access" className="lg:col-span-2">
              <DetailList>
                <DetailItem label="Portal role">{user.role ? ROLE_LABELS[user.role] : null}</DetailItem>
                <DetailItem label="Content">{canWrite ? "Can create, edit and delete" : "View only"}</DetailItem>
                <DetailItem label="Director's Desk">{canManageDirectorDesk(user.role) ? "Can manage" : "View only"}</DetailItem>
                <DetailItem label="Finance">{user.isFinance ? "Finance officer: verifies payments" : "No finance access"}</DetailItem>
                <DetailItem label="Account status">{user.status ? <StatusPill {...STATUS[user.status]} /> : null}</DetailItem>
              </DetailList>
            </Panel>
            {clean(user.description) ? (
              <Panel title="Bio" className="lg:col-span-2">
                <p className="text-sm leading-relaxed text-foreground/90">{user.description}</p>
              </Panel>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
