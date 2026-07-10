import {
  LuAward,
  LuBriefcase,
  LuBuilding2,
  LuCalendar,
  LuMail,
  LuPencil,
  LuPhone,
  LuShield,
  LuUser,
} from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { adminPageCx } from "@/features/admin/components/shared/adminLayout";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useProfile } from "@/lib/api/auth";
import { useDrawer } from "@/store/useDrawer";
import type { UserType } from "@/types/user";
import {
  ROLE_LABELS,
  canManageDirectorDesk,
  canWriteAdminContent,
  isSuperAdmin,
} from "@/types/user";

function initials(name?: string) {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  return `${parts[0][0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function formatServiceYears(user?: UserType | null) {
  if (!user?.startYear) return "—";
  return `${user.startYear}${user.endYear ? ` – ${user.endYear}` : " – Present"}`;
}

function statusBadgeClass(status?: UserType["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "inactive":
      return "bg-slate-100 text-slate-600";
    case "completed":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AdminProfilePage() {
  const { user: storedUser } = useCurrentUser();
  const openDrawer = useDrawer((s) => s.openDrawer);
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useProfile(true);

  const user = profile ?? storedUser;
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : "Admin";

  return (
    <div className={adminPageCx}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl lg:text-3xl">
            Admin Profile
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Your live account profile from the association directory, including
            office assignment and chapter details.
          </p>
        </div>
        {user ? (
          <Button
            className="w-full sm:w-auto"
            onClick={() => openDrawer("edit-profile", { body: user })}
          >
            <LuPencil size={16} />
            Edit Profile
          </Button>
        ) : null}
      </header>

      {isLoading && !user ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-text-muted">Loading your profile…</p>
        </div>
      ) : isError ? (
        <Card className="border border-rose-200 bg-rose-50/40">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <p className="text-sm text-rose-700">
              Unable to load your profile from the server.
            </p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden border border-text-dark/6 bg-surface shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
            <div className="relative border-b border-text-dark/6 bg-linear-to-br from-primary via-[#121f55] to-[#040e3d] px-6 py-8 text-white">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <Avatar className="h-28 w-28 border-4 border-white/20 text-2xl font-bold shadow-lg">
                  {user?.image ? (
                    <AvatarImage src={user.image} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-white/10 text-white">
                    {initials(user?.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                      Executive Profile
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      {user?.name ?? "—"}
                    </h2>
                    <p className="mt-1 text-sm text-white/75">
                      {[user?.rankName, user?.officeName]
                        .filter(Boolean)
                        .join(" · ") || "No office assigned"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/15 text-white hover:bg-white/15">
                      {roleLabel}
                    </Badge>
                    <Badge
                      className={
                        canWriteAdminContent(user?.role)
                          ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/20"
                          : "bg-amber-400/20 text-amber-100 hover:bg-amber-400/20"
                      }
                    >
                      {canWriteAdminContent(user?.role)
                        ? "Write access"
                        : "Read-only access"}
                    </Badge>
                    {user?.status ? (
                      <Badge
                        className={`${statusBadgeClass(user.status)} capitalize`}
                      >
                        {user.status}
                      </Badge>
                    ) : null}
                    {isFetching ? (
                      <Badge className="bg-white/10 text-white/70">
                        Refreshing…
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="grid gap-6 px-6 py-6 lg:grid-cols-2">
              <ProfileSection
                title="Contact Information"
                icon={<LuUser size={16} />}
              >
                <ProfileDetail
                  label="Full Name"
                  value={user?.name}
                  icon={<LuUser size={14} />}
                />
                <ProfileDetail
                  label="Email Address"
                  value={user?.email}
                  icon={<LuMail size={14} />}
                />
                <ProfileDetail
                  label="Phone Number"
                  value={user?.phone}
                  icon={<LuPhone size={14} />}
                />
              </ProfileSection>

              <ProfileSection
                title="Office & Assignment"
                icon={<LuBriefcase size={16} />}
              >
                <ProfileDetail
                  label="Office / Post"
                  value={user?.officeName}
                  icon={<LuBriefcase size={14} />}
                />
                <ProfileDetail
                  label="Rank"
                  value={user?.rankName}
                  icon={<LuAward size={14} />}
                />
                <ProfileDetail
                  label="Public Title"
                  value={user?.title}
                  icon={<LuShield size={14} />}
                />
                <ProfileDetail
                  label="Church"
                  value={user?.churchName}
                  icon={<LuBuilding2 size={14} />}
                />
                <ProfileDetail
                  label="Chapter"
                  value={user?.chapterName}
                  icon={<LuBuilding2 size={14} />}
                />
              </ProfileSection>

              <ProfileSection
                title="Service & Access"
                icon={<LuCalendar size={16} />}
              >
                <ProfileDetail
                  label="Service Period"
                  value={formatServiceYears(user)}
                  icon={<LuCalendar size={14} />}
                />
                <ProfileDetail
                  label="Portal Role"
                  value={roleLabel}
                  icon={<LuShield size={14} />}
                />
                <ProfileDetail
                  label="Director Desk Access"
                  value={
                    canManageDirectorDesk(user?.role)
                      ? "Can manage Director's Desk"
                      : "View only"
                  }
                  icon={<LuShield size={14} />}
                />
                <ProfileDetail
                  label="Account Access"
                  value={
                    canWriteAdminContent(user?.role)
                      ? "Write access"
                      : "Read-only access"
                  }
                />
              </ProfileSection>

              <ProfileSection
                title="Account Summary"
                icon={<LuShield size={16} />}
              >
                <ProfileDetail
                  label="Account Status"
                  value={user?.status?.toUpperCase()}
                />
              </ProfileSection>
            </CardContent>
          </Card>

          {user?.description && user.description !== "—" ? (
            <Card className="border border-text-dark/6 bg-surface shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
              <CardHeader className="border-b border-text-dark/6 px-6 py-5">
                <h3 className="text-base font-semibold text-primary">
                  Bio / Description
                </h3>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <p className="text-sm leading-relaxed text-text-dark/90">
                  {user.description}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function ProfileSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-text-dark/6 bg-background/30 p-4">
      <div className="mb-4 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ProfileDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-text-dark/6 bg-surface px-3 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-text-dark">
        {value?.trim() || "—"}
      </p>
    </div>
  );
}
