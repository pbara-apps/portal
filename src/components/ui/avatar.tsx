import { Avatar as HeroAvatar } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";

type SpanProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "color">;

/** Avatar on HeroUI's Avatar. The image falls back to initials when it fails to load. */
function Avatar({ className, ...props }: SpanProps) {
  return <HeroAvatar className={cn("size-10 shrink-0", className)} {...props} />;
}

function AvatarImage({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <HeroAvatar.Image className={cn("size-full object-cover", className)} {...props} />;
}

function AvatarFallback({ className, ...props }: SpanProps) {
  return (
    <HeroAvatar.Fallback
      className={cn("bg-primary text-[11px] font-semibold tracking-wide text-white", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
