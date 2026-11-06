import { LuCircleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils";

/** Inline validation message shown under a form field. Renders nothing without a message. */
export function FieldMessage({ id, message, className }: { id?: string; message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={cn("flex items-start gap-1.5 text-xs font-medium text-danger", className)}>
      <LuCircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
      {message}
    </p>
  );
}
