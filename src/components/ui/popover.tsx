import { Popover as HeroPopover } from "@heroui/react";
import * as React from "react";
import { OverlayTriggerStateContext } from "react-aria-components";
import { cn } from "@/lib/utils";
import { TriggerSlot } from "./trigger-slot";
import { toPlacement, type OverlayAlign, type OverlaySide } from "./overlay-placement";

/** Floating panel on HeroUI's Popover, keeping the app's compound API. */
interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Popover({ open, onOpenChange, children }: PopoverProps) {
  return (
    <HeroPopover isOpen={open} onOpenChange={onOpenChange}>
      {children}
    </HeroPopover>
  );
}

function PopoverTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  if (asChild && React.isValidElement(children)) return <TriggerSlot>{children}</TriggerSlot>;
  return <HeroPopover.Trigger>{children}</HeroPopover.Trigger>;
}

interface PopoverContentProps {
  side?: OverlaySide;
  align?: OverlayAlign;
  sideOffset?: number;
  className?: string;
  "aria-label"?: string;
  children: React.ReactNode;
}

function PopoverContent({ side = "bottom", align = "center", sideOffset = 8, className, children, ...props }: PopoverContentProps) {
  return (
    <HeroPopover.Content placement={toPlacement(side, align)} offset={sideOffset} className={cn("w-72", className)}>
      <HeroPopover.Dialog {...props} className="p-4 outline-none">
        {children}
      </HeroPopover.Dialog>
    </HeroPopover.Content>
  );
}

/** Closes the surrounding popover when its child is clicked. */
function PopoverClose({ children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }> }) {
  const state = React.useContext(OverlayTriggerStateContext);
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      state?.close();
    },
  });
}

export { Popover, PopoverTrigger, PopoverContent, PopoverClose };
