import type { ReactNode } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";

/** Brand panel on the left (desktop) and a centred card on the right — shared by auth pages. */
export function AuthCardLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden">
      <AuthBrandPanel />
      <section className="flex w-full flex-1 flex-col items-center justify-center bg-background px-4 py-8 lg:w-1/2 lg:bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <img src="/images/ra-logo.png" alt="RA logo" className="mb-2 h-12 w-12 rounded-full object-cover" />
            <p className="text-lg font-bold text-primary">Royal Ambassadors</p>
          </div>
          <div className="rounded-2xl border border-text-dark/5 bg-surface p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
