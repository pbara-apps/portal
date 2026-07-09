import { Link } from "react-router-dom";
import { LuArrowUpRight, LuShieldCheck } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { DirectorDeskPreview } from "@/features/admin/components/dashboard/DirectorDeskPreview";
import { adminPageCx } from "@/features/admin/components/shared/adminLayout";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  ROLE_LABELS,
  canManageDirectorDesk,
  canWriteAdminContent,
} from "@/types/user";

const ACCESS_SCOPES = [
  { role: "Super Admin", permissions: "Full access including role management" },
  { role: "Admin", permissions: "Content and leadership management" },
  { role: "Editor", permissions: "Content updates only" },
  { role: "Viewer", permissions: "Read-only access" },
];

export default function AdministrativePage() {
  const { user } = useCurrentUser();
  const role = user?.role;

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Administrative Center"
        description="Governance tools, account posture, and organization-wide controls."
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-text-dark/[0.06] bg-surface shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
          <CardHeader className="border-b border-text-dark/[0.06] px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-primary">Administrative Posture</h2>
              <p className="mt-1 text-xs text-text-muted">
                Current privileges for your signed-in account.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary">
                {role ? ROLE_LABELS[role] : "Admin"}
              </Badge>
              <Badge
                variant={canWriteAdminContent(role) ? "success" : "secondary"}
                className={
                  canWriteAdminContent(role)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }
              >
                {canWriteAdminContent(role) ? "Update access" : "Read-only access"}
              </Badge>
              <Badge
                className={
                  canManageDirectorDesk(role)
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-600"
                }
              >
                {canManageDirectorDesk(role)
                  ? "Director Desk management enabled"
                  : "Director Desk management restricted"}
              </Badge>
            </div>

            <div className="rounded-xl border border-text-dark/[0.06] bg-background/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
                Access Matrix
              </p>
              <div className="mt-3 space-y-2">
                {ACCESS_SCOPES.map((scope) => (
                  <div
                    key={scope.role}
                    className="flex flex-col gap-1 rounded-lg border border-text-dark/[0.04] bg-surface px-3 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <span className="text-sm font-medium text-text-dark">{scope.role}</span>
                    <span className="text-xs text-text-muted sm:text-right">{scope.permissions}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="bg-primary/10 text-primary">
                <Link to="/admin/profile">
                  Open profile
                  <LuArrowUpRight size={14} />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-slate-100 text-slate-700">
                <Link to="/admin/settings">
                  Open settings
                  <LuArrowUpRight size={14} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <DirectorDeskPreview badge="Leadership" />
          <Card className="border border-text-dark/[0.06] bg-surface shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <LuShieldCheck size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-dark">Security hardening active</p>
                <p className="text-xs text-text-muted">
                  Role-based controls and restricted mutation actions are now enforced.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
