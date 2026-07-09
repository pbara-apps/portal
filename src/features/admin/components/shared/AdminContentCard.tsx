import { LuEllipsisVertical, LuPencil, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AdminContentCardProps {
  id: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  chips?: { label: string; color?: "default" | "success" | "warning" | "danger" }[];
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  fallbackIcon?: React.ReactNode;
  canManage?: boolean;
  disabledReason?: string;
}

function chipVariant(color?: "default" | "success" | "warning" | "danger") {
  switch (color) {
    case "success":
      return "success" as const;
    case "danger":
      return "destructive" as const;
    case "warning":
      return "secondary" as const;
    default:
      return "default" as const;
  }
}

function chipClassName(color?: "default" | "success" | "warning" | "danger") {
  if (color === "warning") {
    return "bg-white/90 text-[10px] font-bold uppercase tracking-wider text-amber-800";
  }
  return "bg-white/90 text-[10px] font-bold uppercase tracking-wider text-primary";
}

export function AdminContentCard({
  id,
  title,
  subtitle,
  image,
  chips = [],
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onClick,
  fallbackIcon,
  canManage = true,
  disabledReason = "You are not allowed to modify this item.",
}: AdminContentCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-[0_1px_2px_rgba(27,36,82,0.04)] transition-all duration-200",
        selected
          ? "border-gold ring-2 ring-gold/30"
          : "border-text-dark/[0.05] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 hover:shadow-[0_8px_24px_rgba(27,36,82,0.08)]",
      )}
    >
      {onSelect ? (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelect(id, v === true)}
            className="bg-white/90 backdrop-blur-sm"
            aria-label={`Select ${title}`}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={canManage ? onClick : undefined}
        disabled={!canManage}
        title={!canManage ? disabledReason : undefined}
        className="focus-ring relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/10 to-[#040e3d]/10 text-left"
      >
        {image ? (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary/40">
            {fallbackIcon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <Badge
                key={chip.label}
                variant={chipVariant(chip.color)}
                className={chipClassName(chip.color)}
              >
                {chip.label}
              </Badge>
            ))}
          </div>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold text-primary">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                {subtitle}
              </p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open actions"
                className="shrink-0 text-text-muted"
                disabled={!canManage}
                title={!canManage ? disabledReason : undefined}
              >
                <LuEllipsisVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canManage} onClick={() => onEdit?.()}>
                <LuPencil size={14} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canManage}
                className="text-rose-600 focus:text-rose-600"
                onClick={() => onDelete?.()}
              >
                <LuTrash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
