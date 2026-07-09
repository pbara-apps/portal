import type { AdminGalleryItem } from "@/types/admin";
import { GalleryBulkCreateForm } from "./GalleryBulkCreateForm";
import { GalleryEditForm } from "./GalleryEditForm";

interface GalleryFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminGalleryItem;
  onClose: () => void;
}

export function GalleryFormDrawer({
  mode,
  initial,
  onClose,
}: GalleryFormDrawerProps) {
  if (mode === "create") {
    return <GalleryBulkCreateForm onClose={onClose} />;
  }

  if (!initial) {
    return null;
  }

  return <GalleryEditForm initial={initial} onClose={onClose} />;
}
