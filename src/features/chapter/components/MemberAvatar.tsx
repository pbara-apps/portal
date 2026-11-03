import { cn } from "@/lib/utils";
import { MEMBER_PLACEHOLDER_PHOTO } from "../lib/member-utils";

/** Member photo, or the association logo when the member has no photo. */
export function MemberAvatar({
  photo,
  name,
  size = 40,
  className,
}: {
  photo?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={photo || MEMBER_PLACEHOLDER_PHOTO}
      alt={photo ? name : "No photo — association logo"}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full border border-text-dark/10 bg-background",
        photo ? "object-cover" : "object-contain p-0.5",
        className,
      )}
    />
  );
}
