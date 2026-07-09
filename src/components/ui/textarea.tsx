import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? React.useId();
    return (
      <div className="w-full space-y-2">
        {label ? (
          <label htmlFor={textareaId} className="text-sm font-semibold text-text-dark">
            {label}
          </label>
        ) : null}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[120px] w-full rounded-md border border-text-dark/15 bg-background/40 px-3 py-2 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-gold/50 focus:bg-background/60 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-500",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
