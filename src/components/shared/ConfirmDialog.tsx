import { AlertDialog } from "@heroui/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for irreversible actions (the default), "accent" for everything else. */
  tone?: "danger" | "accent";
  loading?: boolean;
  /** Extra fields, e.g. a reason the action needs. Keep it to one or two. */
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * The portal's only centred modal for record actions: confirming something
 * before it happens. Creating, editing and viewing belong in a drawer.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  children,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => !open && !loading && onClose()}
      isDismissable={!loading}
      isKeyboardDismissDisabled={loading}
    >
      <AlertDialog.Container size="sm">
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Icon status={tone} />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <div className="text-sm leading-relaxed text-muted">{message}</div>
            {children ? <div className="mt-4">{children}</div> : null}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={tone === "danger" ? "destructive" : "default"}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
