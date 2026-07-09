import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDrawer } from "@/store/useDrawer";
import type {
  AdminChapter,
  AdminEvent,
  AdminExecutive,
  AdminGalleryItem,
  AdminNews,
  AdminOffice,
} from "@/types/admin";
import DirectorDeskView from "../director-desk/DirectorDeskView";
import { ChapterFormDrawer } from "./views/ChapterFormDrawer";
import { EventFormDrawer } from "./views/EventFormDrawer";
import { ExecutiveFormDrawer } from "./views/ExecutiveFormDrawer";
import { GalleryFormDrawer } from "./views/GalleryFormDrawer";
import { NewsFormDrawer } from "./views/NewsFormDrawer";
import { OfficeFormDrawer } from "./views/OfficeFormDrawer";

export function GlobalDrawer() {
  const view = useDrawer((s) => s.view);
  const body = useDrawer((s) => s.body);
  const closeDrawer = useDrawer((s) => s.closeDrawer);
  const isOpen = view !== null;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const onClose = () => closeDrawer();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        hideClose
        className={isMobile ? "w-full max-w-full sm:max-w-full" : "w-full sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl"}
      >
        {view === "create-executive" && <ExecutiveFormDrawer mode="create" onClose={onClose} />}
        {view === "edit-executive" && (
          <ExecutiveFormDrawer
            mode="edit"
            initial={body as unknown as AdminExecutive | undefined}
            onClose={onClose}
          />
        )}
        {view === "create-office" && <OfficeFormDrawer mode="create" onClose={onClose} />}
        {view === "edit-office" && (
          <OfficeFormDrawer
            mode="edit"
            initial={body as unknown as AdminOffice | undefined}
            onClose={onClose}
          />
        )}
        {view === "create-church" && <ChapterFormDrawer mode="create" onClose={onClose} />}
        {view === "edit-church" && (
          <ChapterFormDrawer
            mode="edit"
            initial={body as unknown as AdminChapter | undefined}
            onClose={onClose}
          />
        )}
        {view === "create-news" && <NewsFormDrawer mode="create" onClose={onClose} />}
        {view === "edit-news" && (
          <NewsFormDrawer mode="edit" initial={body as unknown as AdminNews | undefined} onClose={onClose} />
        )}
        {view === "create-event" && <EventFormDrawer mode="create" onClose={onClose} />}
        {view === "edit-event" && (
          <EventFormDrawer mode="edit" initial={body as unknown as AdminEvent | undefined} onClose={onClose} />
        )}
        {view === "create-gallery" && <GalleryFormDrawer mode="create" onClose={onClose} />}
        {view === "edit-gallery" && (
          <GalleryFormDrawer
            mode="edit"
            initial={body as unknown as AdminGalleryItem | undefined}
            onClose={onClose}
          />
        )}
        {view === "edit-director-desk" && <DirectorDeskView onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
