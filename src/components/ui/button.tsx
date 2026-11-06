import {
  Button as HeroButton,
  Spinner,
  buttonVariants as heroButtonVariants,
} from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * App button built on HeroUI's Button.
 * Keeps the app-wide variant/size names so existing call sites don't change.
 */
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const HERO_VARIANT = {
  default: "primary",
  destructive: "danger",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
  link: "ghost",
} as const;

const HERO_SIZE = { default: "md", sm: "sm", lg: "lg", icon: "md" } as const;

const LINK_CX =
  "h-auto px-0 text-accent underline-offset-4 hover:bg-transparent hover:underline data-[hovered=true]:bg-transparent";

interface ButtonVariantOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Class string for elements that should look like a button (e.g. router links). */
function buttonVariants({ variant = "default", size = "default", className }: ButtonVariantOptions = {}) {
  return cn(
    heroButtonVariants({
      variant: HERO_VARIANT[variant],
      size: HERO_SIZE[size],
      isIconOnly: size === "icon",
    }),
    variant === "link" && LINK_CX,
    className,
  );
}

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Style the single child element (e.g. a <Link>) as a button instead of rendering a <button>. */
  asChild?: boolean;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

type HeroButtonProps = React.ComponentProps<typeof HeroButton>;

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  // Match native <button> semantics, which existing forms rely on.
  type = "submit",
  ref,
  ...props
}: ButtonProps) {
  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: buttonVariants({ variant, size, className: cn(className, children.props.className) }),
    });
  }

  return (
    <HeroButton
      {...(props as Omit<HeroButtonProps, "children">)}
      ref={ref}
      type={type}
      variant={HERO_VARIANT[variant]}
      size={HERO_SIZE[size]}
      isIconOnly={size === "icon"}
      isDisabled={disabled}
      isPending={loading}
      className={cn(variant === "link" && LINK_CX, className)}
    >
      {loading ? (
        <>
          <Spinner size="sm" color="current" />
          {children}
        </>
      ) : (
        children
      )}
    </HeroButton>
  );
}

export { Button, buttonVariants };
