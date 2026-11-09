import type { SheetSize } from "@/components/ui/sheet";
import { create } from "zustand";

export type DrawerView =
  | "create-executive"
  | "edit-executive"
  | "view-executive"
  | "create-office"
  | "edit-office"
  | "create-rank"
  | "edit-rank"
  | "create-church"
  | "edit-church"
  | "create-patron"
  | "edit-patron"
  | "create-news"
  | "edit-news"
  | "create-event"
  | "edit-event"
  | "create-gallery"
  | "edit-gallery"
  | "create-program"
  | "edit-program"
  | "view-registration"
  | "create-registration"
  | "view-program-participants"
  | "edit-director-desk"
  | "edit-profile";

export type { SheetSize as DrawerSize } from "@/components/ui/sheet";

/** Every admin view is a full form or record panel, so they share the widest size. */
const DEFAULT_SIZE: SheetSize = "2xl";

type DrawerBody = object;

interface DrawerState {
  view: DrawerView | null;
  body: DrawerBody;
  size: SheetSize;
  openDrawer: (view: DrawerView, options?: { size?: SheetSize; body?: object }) => void;
  closeDrawer: () => void;
}

export const useDrawer = create<DrawerState>((set) => ({
  view: null,
  body: {},
  size: DEFAULT_SIZE,
  openDrawer: (view, options) =>
    set({ view, body: options?.body ?? {}, size: options?.size ?? DEFAULT_SIZE }),
  closeDrawer: () => set({ view: null, body: {}, size: DEFAULT_SIZE }),
}));

/**
 * Type-safe payload reader. Cast to `T` at the call site:
 *
 * ```ts
 * const exec = useDrawerBody<AdminExecutive>();
 * ```
 */
export function useDrawerBody<T>() {
  return useDrawer((s) => s.body as T);
}
