import { Link } from "react-router-dom";
import { LuArrowLeftRight } from "react-icons/lu";
import { useAccount } from "@/lib/auth/session";

/** Shown only to people who can open both portals: jumps to the other one. */
export function AreaSwitch({ to }: { to: "admin" | "chapter" }) {
  const both = useAccount((s) => s.hasAdmin && s.hasChapter);
  if (!both) return null;
  return (
    <Link
      to={to === "admin" ? "/admin" : "/chapter"}
      className="outline-none focus-visible:focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-text-dark/10 bg-surface px-3 text-xs font-semibold text-primary transition-colors hover:border-gold/50 hover:bg-gold/10"
      title={to === "admin" ? "Go to the Admin Portal" : "Go to the Chapter Portal"}
    >
      <LuArrowLeftRight size={14} />
      <span className="hidden sm:inline">{to === "admin" ? "Admin Portal" : "Chapter Portal"}</span>
    </Link>
  );
}
