import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuBookOpen, LuPencil, LuQuote } from "react-icons/lu";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { Button } from "@/components/ui/button";
import type { DirectorDeskBody } from "@/features/admin/components/director-desk/DirectorDeskView";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetAdminDirectorDesk } from "@/lib/api/admin";
import { useDrawer } from "@/store/useDrawer";
import { canManageDirectorDesk } from "@/types/user";

/** The Director's Desk message shown on the public site: preview, read in full, edit. */
export function DirectorDeskPreview() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canManageDirectorDesk(useCurrentUser((s) => s.user)?.role);
  const { data, isLoading } = useGetAdminDirectorDesk();
  const desk = data as DirectorDeskBody | undefined;
  const [reading, setReading] = useState(false);
  const hasMessage = Boolean(desk?.title || desk?.description);

  return (
    <section
      aria-labelledby="director-desk-heading"
      className="relative overflow-hidden rounded-xl bg-sidebar text-white shadow-[var(--surface-shadow)]"
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">Director&apos;s Desk</p>
          <LuQuote size={22} aria-hidden className="text-white/20" />
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-2.5">
            <Skeleton className="h-5 w-3/4 rounded bg-white/10" />
            <Skeleton className="h-3.5 w-full rounded bg-white/10" />
            <Skeleton className="h-3.5 w-2/3 rounded bg-white/10" />
          </div>
        ) : (
          <div className="mt-3 flex gap-4">
            {desk?.image ? (
              <img src={desk.image} alt="" className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-white/15" />
            ) : null}
            <div className="min-w-0">
              <h2 id="director-desk-heading" className="text-base font-semibold leading-snug">
                {desk?.title || "No message yet"}
              </h2>
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/65">
                {desk?.description || "The director's message for the public website will appear here."}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {hasMessage ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setReading(true)}
              className="flex-1 bg-white/10 text-white hover:bg-white/15"
            >
              <LuBookOpen size={15} aria-hidden />
              Read message
            </Button>
          ) : null}
          {canManage ? (
            <Button
              type="button"
              size="sm"
              onClick={() => openDrawer("edit-director-desk", { body: desk ?? {}, size: "lg" })}
              className="flex-1 bg-gold text-primary hover:bg-gold-soft"
            >
              <LuPencil size={15} aria-hidden />
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      <DetailDrawer
        open={reading}
        onClose={() => setReading(false)}
        title={desk?.title || "Director's Desk"}
        description="Message from the Director, as shown on the website"
        media={
          desk?.image ? <img src={desk.image} alt="" className="size-16 rounded-xl object-cover" /> : undefined
        }
      >
        <p className="whitespace-pre-line text-[15px] leading-7 text-foreground">{desk?.description}</p>
      </DetailDrawer>
    </section>
  );
}
