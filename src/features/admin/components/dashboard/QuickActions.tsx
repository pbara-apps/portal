import { Link } from "react-router-dom";
import type { IconType } from "react-icons";
import { LuChevronRight } from "react-icons/lu";

export interface QuickAction {
  label: string;
  icon: IconType;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-primary to-[#040e3d] p-5 shadow-[0_4px_20px_rgba(27,36,82,0.18)] ring-1 ring-white/5">
      <h3 className="text-base font-semibold text-white">Quick Actions</h3>
      <p className="mt-0.5 text-xs text-white/55">
        Jump straight into common tasks
      </p>

      <div className="mt-4 space-y-2">
        {actions.map((a) => {
          const Icon = a.icon;
          const className = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
            a.disabled
              ? "cursor-not-allowed bg-white/[0.04] text-white/45"
              : "bg-white/[0.06] text-white hover:bg-white/[0.12]"
          }`;

          const content = (
            <>
              <span
                className={`flex items-center justify-center rounded-lg transition-colors ${
                  a.disabled ? "bg-white/10 text-white/45" : "bg-gold/15 text-gold"
                }`}
              >
                <Icon size={20} />
              </span>
              <span className="flex-1">{a.label}</span>
              <LuChevronRight
                size={16}
                className={`transition-transform ${
                  a.disabled
                    ? "text-white/20"
                    : "text-white/30 group-hover:translate-x-0.5 group-hover:text-white/70"
                }`}
              />
            </>
          );

          if (a.href && !a.disabled) {
            return (
              <Link key={a.label} to={a.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={a.label}
              onClick={a.onClick}
              type="button"
              className={className}
              disabled={a.disabled}
              title={a.disabled ? a.disabledReason : undefined}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
