import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-primary/10 text-primary",
        variant === "secondary" && "bg-background text-text-dark",
        variant === "destructive" && "bg-rose-100 text-rose-700",
        variant === "outline" && "border border-text-dark/10 text-text-dark",
        variant === "success" && "bg-emerald-100 text-emerald-700",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
