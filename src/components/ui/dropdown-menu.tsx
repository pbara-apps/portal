import { Dropdown, Separator } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { TriggerSlot } from "./trigger-slot";
import { toPlacement, type OverlayAlign, type OverlaySide } from "./overlay-placement";

/** Action menu on HeroUI's Dropdown, keeping the app's compound API. */
interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function DropdownMenu({ open, onOpenChange, children }: DropdownMenuProps) {
  return (
    <Dropdown isOpen={open} onOpenChange={onOpenChange}>
      {children}
    </Dropdown>
  );
}

function DropdownMenuTrigger({
  asChild,
  className,
  children,
}: {
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (asChild && React.isValidElement(children)) return <TriggerSlot>{children}</TriggerSlot>;
  return <Dropdown.Trigger className={className}>{children}</Dropdown.Trigger>;
}

interface DropdownMenuContentProps {
  align?: OverlayAlign;
  side?: OverlaySide;
  sideOffset?: number;
  className?: string;
  children: React.ReactNode;
}

function DropdownMenuContent({ align = "start", side = "bottom", sideOffset = 6, className, children }: DropdownMenuContentProps) {
  return (
    <Dropdown.Popover placement={toPlacement(side, align)} offset={sideOffset} className={cn("min-w-44", className)}>
      <Dropdown.Menu aria-label="Actions">{children}</Dropdown.Menu>
    </Dropdown.Popover>
  );
}

interface DropdownMenuItemProps {
  onClick?: () => void;
  onSelect?: () => void;
  disabled?: boolean;
  /** "danger" styles destructive actions. */
  variant?: "default" | "danger";
  className?: string;
  textValue?: string;
  /** Navigates within the app (client-side) when chosen. */
  href?: string;
  children: React.ReactNode;
}

function DropdownMenuItem({ onClick, onSelect, disabled, variant = "default", className, textValue, href, children }: DropdownMenuItemProps) {
  return (
    <Dropdown.Item
      onAction={() => {
        onSelect?.();
        onClick?.();
      }}
      href={href}
      isDisabled={disabled}
      variant={variant}
      textValue={textValue}
      className={cn("gap-2 [&_svg]:size-4 [&_svg]:shrink-0", className)}
    >
      {children}
    </Dropdown.Item>
  );
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Separator className={cn("my-1", className)} />;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };
