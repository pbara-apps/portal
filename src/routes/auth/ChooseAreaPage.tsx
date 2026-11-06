import { Link, Navigate, useNavigate } from "react-router-dom";
import { LuArrowRight, LuChurch, LuLogOut, LuShieldCheck } from "react-icons/lu";
import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { useChapterSession } from "@/features/chapter/store/useChapterSession";
import { PORTAL_ROLE_LABELS } from "@/features/chapter/types";
import useCurrentUser from "@/hooks/useCurrentUser";
import { landingPath, signOutEverywhere, useAccount } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/types/user";

/** For people with both admin and chapter access: pick where to go. */
export default function ChooseAreaPage() {
  const navigate = useNavigate();
  const account = useAccount();
  const admin = useCurrentUser((s) => s.user);
  const chapter = useChapterSession((s) => s.profile);

  if (!account.token) return <Navigate to="/login" replace />;
  if (!account.hasChangedPassword || !(account.hasAdmin && account.hasChapter)) {
    return <Navigate to={landingPath(account)} replace />;
  }

  const options = [
    {
      to: "/admin",
      icon: LuShieldCheck,
      title: "Admin Portal",
      detail: admin?.role ? `Association admin · ${ROLE_LABELS[admin.role]}` : "Association admin",
    },
    {
      to: "/chapter",
      icon: LuChurch,
      title: "Chapter Portal",
      detail: chapter
        ? `${PORTAL_ROLE_LABELS[chapter.role]} · ${chapter.church?.name ?? ""}`
        : "Chapter leader",
    },
  ];

  return (
    <AuthCardLayout
      title={`Hello, ${account.name.split(" ")[0] || "there"}`}
      subtitle="Your account opens two portals. Where would you like to go? You can switch any time from the top bar."
    >
      <div className="flex flex-col gap-3">
        {options.map(({ to, icon: Icon, title, detail }) => (
          <Link
            key={to}
            to={to}
            replace
            className="group flex items-center gap-4 rounded-2xl border border-text-dark/10 p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-primary">{title}</span>
              <span className="block truncate text-xs text-text-muted">{detail}</span>
            </span>
            <LuArrowRight size={18} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            signOutEverywhere();
            navigate("/login", { replace: true });
          }}
          className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-primary"
        >
          <LuLogOut size={13} /> Sign out
        </button>
      </div>
    </AuthCardLayout>
  );
}
