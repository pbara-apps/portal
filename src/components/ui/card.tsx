import { Card as HeroCard } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card on HeroUI's Card. The sub-parts keep the app's existing padding contract
 * (header/content/footer each own their padding), so the root has none.
 */
type DivProps = React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> };

function Card({ className, children, ...props }: DivProps) {
  return (
    <HeroCard className={cn("gap-0 p-0 text-foreground", className)} {...props}>
      {children}
    </HeroCard>
  );
}

function CardHeader({ className, ...props }: DivProps) {
  return <HeroCard.Header className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <HeroCard.Title
      className={cn("text-base font-semibold leading-tight tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <HeroCard.Description className={cn("text-sm text-muted", className)} {...props} />;
}

function CardContent({ className, ...props }: DivProps) {
  return <HeroCard.Content className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: DivProps) {
  return <HeroCard.Footer className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
