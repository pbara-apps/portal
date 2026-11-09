import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Primary and secondary page actions, right-aligned on wide screens. */
  actions?: ReactNode;
  /** Small facts under the description, such as record counts. */
  meta?: ReactNode;
  className?: string;
}

/** Title block at the top of every portal page. */
export function PageHeader({ title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-[1.75rem] lg:leading-9">
          {title}
        </h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
