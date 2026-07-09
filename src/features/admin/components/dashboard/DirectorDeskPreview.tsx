import { LuArrowRight, LuPencil, LuQuote } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useGetAdminDirectorDesk } from "@/lib/api/admin";
import { useDrawer } from "@/store/useDrawer";
import useCurrentUser from "@/hooks/useCurrentUser";
import { canManageDirectorDesk } from "@/types/user";

export interface DirectorDeskPreviewProps {
  badge?: string;
  onRead?: () => void;
}

export function DirectorDeskPreview({
  badge = "Editorial",
  onRead,
}: DirectorDeskPreviewProps) {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canManageDirectorDesk(user?.role);

  const { data: directorDesk } = useGetAdminDirectorDesk();

  const handleEdit = () => {
    openDrawer("edit-director-desk", {
      config: {
        size: "3xl",
      },
      body: directorDesk,
    });
  };
  return (
    <article className="overflow-hidden rounded-2xl border border-text-dark/[0.05] bg-surface shadow-[0_1px_2px_rgba(27,36,82,0.04)]">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary via-[#1B2452] to-[#040e3d]">
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_30%_20%,rgba(200,168,75,0.35),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(200,168,75,0.18),transparent_50%)]" />
        <LuQuote
          className="absolute right-4 top-4 text-gold"
          size={64}
          aria-hidden
        />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex justify-between items-end">
            <div>
              <span className="inline-block rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                {badge}
              </span>
              <h3 className="mt-2 text-lg font-bold leading-tight text-white">
                The Director&apos;s Desk
              </h3>
            </div>
            <Button
              size="sm"
              className="rounded-full"
              onClick={handleEdit}
              disabled={!canManage}
            >
              <LuPencil size={16} />
              {canManage ? "Edit" : "Read only"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h4 className="text-base font-semibold tracking-tight text-primary">
          {directorDesk?.title}
        </h4>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-muted">
          {directorDesk?.description}
        </p>
        <button
          type="button"
          onClick={onRead}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/15 bg-primary/[0.03] py-2.5 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"
        >
          Read Full Message
          <LuArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
