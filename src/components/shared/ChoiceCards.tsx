import { cn } from "@/lib/utils";

/** Two option cards backed by real radio inputs (arrow keys work). */
export function ChoiceCards<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: { value: T; label: string; hint: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                checked ? "border-focus/50 bg-focus/[0.05]" : "border-border hover:border-foreground/20",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    checked ? "border-focus" : "border-foreground/25",
                  )}
                >
                  {checked ? <span className="size-2 rounded-full bg-focus" /> : null}
                </span>
                {o.label}
              </span>
              <span className="mt-1 block pl-6 text-xs text-muted">{o.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
