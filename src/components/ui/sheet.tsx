import { Drawer } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Side panel on HeroUI's Drawer. The app's standard surface for creating,
 * editing and viewing records.
 *
 * Layout contract: <SheetHeader> and <SheetFooter> stay pinned, <SheetBody> scrolls.
 */
interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

type SheetState = Omit<SheetProps, "children">;

/**
 * Panels open from app state rather than a trigger button, so open state goes
 * straight to the backdrop (HeroUI's Drawer root expects a trigger child).
 */
const SheetStateContext = React.createContext<SheetState>({});

function Sheet({ children, ...state }: SheetProps) {
  return <SheetStateContext value={state}>{children}</SheetStateContext>;
}

type SheetSide = "right" | "left" | "top" | "bottom";

interface SheetContentProps {
  side?: SheetSide;
  className?: string;
  children: React.ReactNode;
  hideClose?: boolean;
  "aria-label"?: string;
}

function SheetContent({ side = "right", className, children, hideClose, ...props }: SheetContentProps) {
  const { open, onOpenChange } = React.use(SheetStateContext);
  return (
    <Drawer.Backdrop variant="opaque" isOpen={open} onOpenChange={onOpenChange}>
      <Drawer.Content placement={side}>
        <Drawer.Dialog
          {...props}
          className={cn(
            "max-h-dvh overflow-hidden p-0 text-foreground",
            (side === "right" || side === "left") && "w-full max-w-full sm:max-w-xl",
            className,
          )}
        >
          {children}
          {!hideClose ? (
            <Drawer.CloseTrigger aria-label="Close panel" className="absolute right-4 top-4 z-10" />
          ) : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

const PANEL_X = "px-5 sm:px-6 lg:px-8";

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Drawer.Header
      className={cn("flex shrink-0 flex-col gap-1.5 border-b border-separator py-5 pr-14", PANEL_X, className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Drawer.Footer
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-separator bg-surface py-4 sm:flex-row sm:justify-end",
        PANEL_X,
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Drawer.Heading
      className={cn("text-lg font-semibold leading-tight tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Drawer.Body
      className={cn("min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-6", PANEL_X, className)}
      {...props}
    />
  );
}

export { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetBody };
