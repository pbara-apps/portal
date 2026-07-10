import type { ReactNode } from "react";
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
import { SheetBody, SheetHeader } from "@/components/ui/sheet";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import { StatusChip } from "@/features/admin/components/executives/StatusChip";
import { useDrawer } from "@/store/useDrawer";
import type { AdminExecutive } from "@/types/admin";
import {
  ROLE_LABELS,
  canManageDirectorDesk,
  canWriteAdminContent,
} from "@/types/user";

interface ExecutiveViewDrawerProps {
  executive?: AdminExecutive;
  onClose: () => void;
  canEdit?: boolean;
}

function initials(name?: string) {
  if (!name) return "EX";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EX";
  return `${parts[0][0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function formatServiceYears(exec?: AdminExecutive) {
  if (!exec?.startYear) return "—";
  return `${exec.startYear}${exec.endYear ? ` – ${exec.endYear}` : " – Present"}`;
}

export function ExecutiveViewDrawer({
  executive,
  canEdit = false,
}: ExecutiveViewDrawerProps) {
  const openDrawer = useDrawer((s) => s.openDrawer);

  if (!executive) {
    return (
      <DrawerFormShell>
        <SheetHeader className="border-b border-text-dark/6 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-primary">
              Executive details
            </h2>
          </div>
        </SheetHeader>
        <SheetBody className="px-6 py-10">
          <p className="text-center text-sm text-text-muted">
            Executive details are unavailable.
          </p>
        </SheetBody>
      </DrawerFormShell>
    );
  }

  const roleLabel = ROLE_LABELS[executive.role] ?? executive.role;

  return (
    <DrawerFormShell>
      <SheetHeader className="border-b border-text-dark/6 px-6 py-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Executive
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-primary">
              {executive.name}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canEdit ? (
              <Button
                size="sm"
                onClick={() =>
                  openDrawer("edit-executive", { body: executive })
                }
              >
                <LuPencil size={14} />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
      </SheetHeader>

      <SheetBody className="space-y-6 overflow-y-auto px-6 py-6">
        <Card className="overflow-hidden border border-text-dark/6 bg-surface shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
          <div className="relative border-b border-text-dark/6 bg-linear-to-br from-primary via-[#121f55] to-[#040e3d] px-6 py-8 text-white">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 border-4 border-white/20 text-xl font-bold shadow-lg">
                {executive.image ? (
                  <AvatarImage src={executive.image} alt={executive.name} />
                ) : null}
                <AvatarFallback className="bg-white/10 text-white">
                  {initials(executive.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                    Executive Profile
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight">
                    {executive.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/75">
                    {[executive.rankName, executive.officeName]
                      .filter(Boolean)
                      .join(" · ") || "No office assigned"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/15 text-white hover:bg-white/15">
                    {roleLabel}
                  </Badge>
                  <Badge
                    className={
                      canWriteAdminContent(executive.role)
                        ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/20"
                        : "bg-amber-400/20 text-amber-100 hover:bg-amber-400/20"
                    }
                  >
                    {canWriteAdminContent(executive.role)
                      ? "Write access"
                      : "Read-only access"}
                  </Badge>
                  <StatusChip status={executive.status} />
                </div>
              </div>
            </div>
          </div>

          <CardContent className="grid gap-5 px-5 py-5 lg:grid-cols-2">
            <ProfileSection
              title="Contact Information"
              icon={<LuUser size={16} />}
            >
              <ProfileDetail
                label="Full Name"
                value={executive.name}
                icon={<LuUser size={14} />}
              />
              <ProfileDetail
                label="Email Address"
                value={executive.email}
                icon={<LuMail size={14} />}
              />
              <ProfileDetail
                label="Phone Number"
                value={executive.phone}
                icon={<LuPhone size={14} />}
              />
            </ProfileSection>

            <ProfileSection
              title="Office & Assignment"
              icon={<LuBriefcase size={16} />}
            >
              <ProfileDetail
                label="Office / Post"
                value={executive.officeName}
                icon={<LuBriefcase size={14} />}
              />
              <ProfileDetail
                label="Rank"
                value={executive.rankName}
                icon={<LuAward size={14} />}
              />
              <ProfileDetail
                label="Church"
                value={executive.churchName}
                icon={<LuBuilding2 size={14} />}
              />
              <ProfileDetail
                label="Chapter"
                value={executive.chapterName}
                icon={<LuBuilding2 size={14} />}
              />
            </ProfileSection>

            <ProfileSection
              title="Service & Access"
              icon={<LuCalendar size={16} />}
            >
              <ProfileDetail
                label="Service Period"
                value={formatServiceYears(executive)}
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
                  canManageDirectorDesk(executive.role)
                    ? "Can manage Director's Desk"
                    : "View only"
                }
                icon={<LuShield size={14} />}
              />
              <ProfileDetail
                label="Account Access"
                value={
                  canWriteAdminContent(executive.role)
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
                value={executive.status?.toUpperCase()}
              />
            </ProfileSection>
          </CardContent>
        </Card>

        {executive.description?.trim() ? (
          <Card className="border border-text-dark/6 bg-surface shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
            <CardHeader className="border-b border-text-dark/6 px-5 py-4">
              <h3 className="text-base font-semibold text-primary">
                Bio / Description
              </h3>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <p className="text-sm leading-relaxed text-text-dark/90">
                {executive.description}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </SheetBody>
    </DrawerFormShell>
  );
}

function ProfileSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
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
  icon?: ReactNode;
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
