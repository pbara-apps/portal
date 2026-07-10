import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, startContent, endContent, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="w-full space-y-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="block w-full text-sm font-semibold text-text-dark"
          >
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            "flex h-11 w-full min-w-0 items-center gap-2 rounded-md border border-text-dark/15 bg-background/40 px-3 transition-colors focus-within:border-gold/50 focus-within:bg-background/60",
            error && "border-rose-500 focus-within:border-rose-500",
            className,
          )}
        >
          {startContent ? (
            <span className="shrink-0 text-text-muted">{startContent}</span>
          ) : null}
          <input
            id={inputId}
            type={type}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50"
            ref={ref}
            {...props}
          />
          {endContent ? <span className="shrink-0">{endContent}</span> : null}
        </div>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
