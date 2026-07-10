import { useEffect, useRef, useState } from "react";
import {
  LuBold,
  LuImage,
  LuItalic,
  LuLink,
  LuList,
  LuQuote,
  LuTrash2,
  LuUpload,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import { Textarea } from "@/components/ui/textarea";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useUpdateAdminDirectorDesk } from "@/lib/api/admin";
import { useDrawerBody } from "@/store/useDrawer";
import { canManageDirectorDesk } from "@/types/user";
import { cn } from "@/lib/utils";

export interface DirectorDeskBody {
  image?: string | null;
  title?: string;
  description?: string;
  portrait?: string | null;
}

interface DirectorDeskViewProps {
  onClose: () => void;
}

const DirectorDeskView = ({ onClose }: DirectorDeskViewProps) => {
  const initial = useDrawerBody<DirectorDeskBody>();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [portrait, setPortrait] = useState<string | null>(
    initial?.image ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useCurrentUser();
  const updateDirectorDesk = useUpdateAdminDirectorDesk();
  const canManage = canManageDirectorDesk(user?.role);

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPortrait(initial?.portrait ?? null);
  }, [initial?.title, initial?.description, initial?.portrait]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPortrait(String(e.target?.result ?? ""));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!canManage) {
      errorToast("Only Admins and Super Admins can update Director's Desk.", "Unauthorized");
      return;
    }
    setSaving(true);
    try {
      await updateDirectorDesk.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        image: portrait,
      });
      successToast("Director's Desk updated successfully.");
      onClose();
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to update Director's Desk.",
        "Error",
      );
    } finally {
      setSaving(false);
    }
  };

  const canSave = title.trim().length > 0 && description.trim().length > 0;

  return (
    <DrawerFormShell>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          Director&apos;s Desk
        </h3>
        <p className="text-xs text-text-muted">
          Update the portrait, headline, and message shown on the public
          Director&apos;s Desk section.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-6">
        {!canManage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              You do not have permission to update this section.
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Only Super Admins and Admins can modify Director&apos;s Desk.
            </p>
          </div>
        ) : null}
        <section>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Director&apos;s Portrait
          </label>

          {portrait ? (
            <div className="group relative h-72 w-full overflow-hidden rounded-xl border border-text-dark/10 bg-background/40">
              <img
                src={portrait}
                alt="Director portrait preview"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/95 font-semibold text-primary backdrop-blur"
                  disabled={!canManage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <LuUpload size={14} />
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-rose-50/95 font-semibold text-rose-700 backdrop-blur"
                  disabled={!canManage}
                  onClick={() => setPortrait(null)}
                >
                  <LuTrash2 size={14} />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={cn(
                "group flex h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all",
                dragOver
                  ? "border-gold/60 bg-gold/5"
                  : "border-text-dark/15 bg-background/40 hover:border-text-dark/25 hover:bg-background/60",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={!canManage}
              />
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary transition-transform",
                  dragOver && "scale-110",
                )}
              >
                <LuUpload size={20} />
              </div>
              <p className="text-sm font-medium text-text-dark">
                Drag &amp; drop, or{" "}
                <span className="font-semibold text-primary">
                  click to browse
                </span>
              </p>
              <p className="text-xs text-text-muted">
                Optimal: 800×1200px (vertical portrait) · JPG or PNG · max 4 MB
              </p>
            </label>
          )}
        </section>

        <Input
          label="Director Desk Title"
          placeholder="e.g. Spiritual Leadership in Modern Times"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canManage}
          required
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-text-dark">
              Description <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-text-muted">
              {description.length} characters
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-text-dark/15 bg-background/40 transition-all focus-within:border-gold/60 focus-within:bg-surface focus-within:ring-4 focus-within:ring-gold/15">
            <div className="flex items-center gap-1 border-b border-text-dark/10 bg-background/60 px-2 py-1.5">
              <FormatBtn label="Bold" icon={<LuBold size={14} />} />
              <FormatBtn label="Italic" icon={<LuItalic size={14} />} />
              <FormatBtn label="Bulleted list" icon={<LuList size={14} />} />
              <FormatBtn label="Block quote" icon={<LuQuote size={14} />} />
              <FormatBtn label="Insert link" icon={<LuLink size={14} />} />
              <span className="mx-1 h-5 w-px bg-text-dark/10" aria-hidden />
              <FormatBtn label="Insert image" icon={<LuImage size={14} />} />
            </div>
            <Textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage}
              placeholder="Start typing the director's message here…"
              className="min-h-[200px] border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </SheetBody>

      <SheetFooter className="bg-background/40">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-text-dark/15 font-semibold text-text-dark"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!canSave || !canManage}
          className="bg-primary font-semibold text-white shadow-md hover:bg-[#040e3d]"
        >
          {saving ? "Saving…" : "Update Director's Desk"}
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
};

export default DirectorDeskView;

function FormatBtn({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-text-dark/5 hover:text-text-dark"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
