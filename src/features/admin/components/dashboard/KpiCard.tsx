import type { IconType } from "react-icons";

export type KpiTrend = "up" | "down" | "flat" | "alert";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  trend?: KpiTrend;
  trendValue?: string;
}

export function KpiCard({ label, value, icon: Icon }: KpiCardProps) {
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-text-dark/[0.05] bg-surface p-5 shadow-[0_1px_2px_rgba(27,36,82,0.04),0_4px_12px_rgba(27,36,82,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(27,36,82,0.06),0_8px_24px_rgba(27,36,82,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900/20 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <Icon size={20} />
        </div>
        <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
          {value}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
          {label}
        </p>
      </div>
    </div>
  );
}
