import { Modal } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Centered dialog on HeroUI's Modal.
 * Use it for confirmations and short focused tasks; record create/edit/detail
 * views belong in a drawer (see ./sheet).
 */
interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

type DialogState = Omit<DialogProps, "children">;

/**
 * Dialogs here are opened from app state, not a trigger button, so open state is
 * handed to the backdrop (HeroUI's Modal root expects a trigger child).
 */
const DialogStateContext = React.createContext<DialogState>({});

function Dialog({ children, ...state }: DialogProps) {
  return <DialogStateContext value={state}>{children}</DialogStateContext>;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  hideClose?: boolean;
  /** When false, outside clicks and Escape don't close the dialog. */
  dismissable?: boolean;
  role?: "dialog" | "alertdialog";
}

function DialogContent({ className, children, hideClose, dismissable = true, role }: DialogContentProps) {
  const { open, defaultOpen, onOpenChange } = React.use(DialogStateContext);
  return (
    <Modal.Backdrop
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isDismissable={dismissable}
      isKeyboardDismissDisabled={!dismissable}
    >
      <Modal.Container placement="center" scroll="outside" size="lg">
        <Modal.Dialog role={role} className={cn("grid gap-4 rounded-2xl p-6", className)}>
          {children}
          {!hideClose ? <Modal.CloseTrigger aria-label="Close" /> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Modal.Header className={cn("flex flex-col gap-1.5 pr-8 text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Modal.Footer
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Modal.Heading
      className={cn("text-lg font-semibold leading-tight tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-muted", className)} {...props} />;
}

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
