import { Link } from "react-router-dom";
import type { IconType } from "react-icons";
import { LuCheck, LuChevronRight, LuMinus, LuSettings, LuShieldCheck, LuUser } from "react-icons/lu";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { DirectorDeskPreview } from "@/features/admin/components/dashboard/DirectorDeskPreview";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import {
  ROLE_LABELS,
  canManageDirectorDesk,
  canManageDues,
  canWriteAdminContent,
  type ExecutiveRole,
} from "@/types/user";

const ACCESS_SCOPES: { role: ExecutiveRole; permissions: string }[] = [
  { role: "super_admin", permissions: "Full access, including accounts and roles" },
  { role: "admin", permissions: "Content, leadership and the Director's Desk" },
  { role: "editor", permissions: "Content updates only" },
  { role: "finance", permissions: "Dues, levies and payment approvals" },
  { role: "viewer", permissions: "Read-only access" },
];

const LINKS: { label: string; description: string; href: string; icon: IconType }[] = [
  { label: "Profile", description: "Your details and password", href: "/admin/profile", icon: LuUser },
  { label: "Settings", description: "Association-wide configuration", href: "/admin/settings", icon: LuSettings },
];

function Permission({ allowed, children }: { allowed: boolean; children: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          allowed ? "bg-success/10 text-success" : "bg-default text-muted",
        )}
        aria-hidden
      >
        {allowed ? <LuCheck size={12} /> : <LuMinus size={12} />}
      </span>
      <span className={allowed ? "text-foreground" : "text-muted"}>{children}</span>
      <span className="sr-only">{allowed ? "(allowed)" : "(not allowed)"}</span>
    </li>
  );
}

export default function AdministrativePage() {
  const user = useCurrentUser((s) => s.user);
  const role = user?.role;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Administrative center"
        description="Your access level, what each role can do, and the Director's Desk."
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Panel
            title="Your access"
            description="What your signed-in account can do"
            action={<Badge>{role ? ROLE_LABELS[role] : "Admin"}</Badge>}
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              <Permission allowed={canWriteAdminContent(role)}>Create and edit content</Permission>
              <Permission allowed={canManageDirectorDesk(role)}>Manage the Director&apos;s Desk</Permission>
              <Permission allowed={canManageDues(user)}>Manage dues and levies</Permission>
              <Permission allowed={role === "super_admin"}>Manage accounts and roles</Permission>
            </ul>
          </Panel>

          <Panel title="Roles" description="Access granted to each admin role" bodyClassName="p-0">
            <ul className="divide-y divide-separator">
              {ACCESS_SCOPES.map((scope) => {
                const current = scope.role === role;
                return (
                  <li
                    key={scope.role}
                    className={cn(
                      "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5",
                      current && "bg-surface-secondary",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {ROLE_LABELS[scope.role]}
                      {current ? <Badge variant="outline">You</Badge> : null}
                    </span>
                    <span className="text-sm text-muted sm:text-right">{scope.permissions}</span>
                  </li>
                );
              })}
            </ul>
            <p className="flex items-start gap-2 border-t border-separator px-4 py-3 text-xs text-muted sm:px-5">
              <LuShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-success" />
              Permissions are checked by the server on every request, not only hidden in the interface.
            </p>
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <DirectorDeskPreview />
          <Panel title="Account" bodyClassName="p-2">
            <ul className="space-y-0.5">
              {LINKS.map(({ label, description, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted">
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{label}</span>
                      <span className="block truncate text-xs text-muted">{description}</span>
                    </span>
                    <LuChevronRight size={16} aria-hidden className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
