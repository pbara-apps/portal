import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[80] bg-primary/30 backdrop-blur-sm",
      "data-[state=open]:animate-[sheet-fade-in_0.2s_ease-out]",
      "data-[state=closed]:animate-[sheet-fade-out_0.2s_ease-in_forwards]",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-[80] flex flex-col bg-surface p-0 shadow-lg outline-none",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 max-h-[100dvh] border-b",
        bottom: "inset-x-0 bottom-0 max-h-[100dvh] border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-full border-l sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

const sheetEnterAnimation: Record<NonNullable<VariantProps<typeof sheetVariants>["side"]>, string> = {
  top: "data-[state=open]:animate-[sheet-slide-in-from-right_0.3s_ease-out]",
  bottom: "data-[state=open]:animate-[sheet-slide-in-from-right_0.3s_ease-out]",
  left: "data-[state=open]:animate-[sheet-slide-in-from-left_0.3s_ease-out]",
  right: "data-[state=open]:animate-[sheet-slide-in-from-right_0.3s_ease-out]",
};

const sheetExitAnimation: Record<NonNullable<VariantProps<typeof sheetVariants>["side"]>, string> = {
  top: "data-[state=closed]:animate-[sheet-slide-out-to-right_0.25s_ease-in_forwards]",
  bottom: "data-[state=closed]:animate-[sheet-slide-out-to-right_0.25s_ease-in_forwards]",
  left: "data-[state=closed]:animate-[sheet-slide-out-to-left_0.25s_ease-in_forwards]",
  right: "data-[state=closed]:animate-[sheet-slide-out-to-right_0.25s_ease-in_forwards]",
};

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  hideClose?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, hideClose, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        sheetVariants({ side }),
        sheetEnterAnimation[side ?? "right"],
        sheetExitAnimation[side ?? "right"],
        "text-text-dark",
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose ? (
        <SheetPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      ) : null}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "shrink-0 flex flex-col space-y-2 border-b border-text-dark/5 px-4 py-5 sm:px-6 md:px-8 lg:px-10",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "shrink-0 flex flex-col-reverse gap-2 border-t border-text-dark/5 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 md:px-8 lg:px-10",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-primary", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-muted", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 md:px-8 lg:px-10",
      className,
    )}
    {...props}
  />
);
SheetBody.displayName = "SheetBody";

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetBody,
};
