import { Focusable, Tooltip as HeroTooltip } from "@heroui/react";
import * as React from "react";
import { Button } from "./button";

type FocusableChild = React.ComponentProps<typeof Focusable>["children"];
type Placement ="top" | "bottom" | "start" | "end" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  /** One focusable element: our <Button>, a <button>, or a router <Link>. */
  children: React.ReactElement;
  placement?: Placement;
  /** Skip the tooltip (e.g. when the label is already visible). */
  disabled?: boolean;
  delay?: number;
}

/**
 * Short label shown on hover and keyboard focus. It supplements, not
 * replaces, an accessible name: icon-only triggers still need aria-label.
 */
export function Tooltip({ content, children, placement = "top", disabled, delay }: TooltipProps) {
  if (disabled) return children;
  // Our Button is already a React Aria button; plain elements are made focusable
  // in place, so the tooltip adds no extra tab stop.
  // Focusable is typed for DOM elements, but any child that forwards its ref to
  // one (e.g. a router <Link>, which renders an <a>) works the same.
  const trigger =
    children.type === Button ? children : <Focusable>{children as FocusableChild}</Focusable>;
  return (
    <HeroTooltip delay={delay}>
      {trigger}
      <HeroTooltip.Content placement={placement} className="text-xs font-medium">
        {content}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}
