import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  type SheetSize,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FormDrawerContentProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Runs on submit (button or Enter). Validate here and show errors on the fields. */
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  /** Left side of the footer, e.g. a delete action when editing. */
  footerStart?: ReactNode;
  bodyClassName?: string;
}

/**
 * Header, scrolling fields and pinned Cancel/Save footer for a create or edit
 * form. Use inside the admin GlobalDrawer, or through <FormDrawer> elsewhere.
 *
 * The whole panel is a <form> (Enter submits), so any other button in the
 * fields needs type="button". Browser validation bubbles are off: forms
 * validate in onSubmit and pass messages to each field's `error` prop.
 */
export function FormDrawerContent({
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitting = false,
  submitDisabled = false,
  footerStart,
  bodyClassName,
}: FormDrawerContentProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitting) return;
    const form = e.currentTarget;
    void Promise.resolve(onSubmit()).then(() => {
      // Move focus to the first field the form flagged, so the error is announced.
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full min-h-0 flex-col">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        {description ? <SheetDescription>{description}</SheetDescription> : null}
      </SheetHeader>
      <SheetBody className={cn("space-y-5", bodyClassName)}>{children}</SheetBody>
      <SheetFooter className={cn(footerStart && "sm:justify-between")}>
        {footerStart ? <div className="flex flex-col gap-2 sm:flex-row">{footerStart}</div> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button type="submit" loading={submitting} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </SheetFooter>
    </form>
  );
}

interface FormDrawerProps extends FormDrawerContentProps {
  open: boolean;
  size?: SheetSize;
}

/** Self-contained create/edit drawer, controlled by the page. */
export function FormDrawer({ open, size = "md", ...props }: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && !props.submitting && props.onCancel()}>
      <SheetContent size={size}>
        <FormDrawerContent {...props} />
      </SheetContent>
    </Sheet>
  );
}
