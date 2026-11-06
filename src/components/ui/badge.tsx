import { Chip } from "@heroui/react";
import * as React from "react";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const CHIP_PROPS = {
  default: { color: "accent", variant: "soft" },
  secondary: { color: "default", variant: "secondary" },
  destructive: { color: "danger", variant: "soft" },
  outline: { color: "default", variant: "tertiary" },
  success: { color: "success", variant: "soft" },
  warning: { color: "warning", variant: "soft" },
} as const;

interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  variant?: BadgeVariant;
}

/** Small status label, built on HeroUI's Chip. */
function Badge({ variant = "default", children, ...props }: BadgeProps) {
  return (
    <Chip size="sm" {...CHIP_PROPS[variant]} {...props}>
      {children}
    </Chip>
  );
}

export { Badge };
