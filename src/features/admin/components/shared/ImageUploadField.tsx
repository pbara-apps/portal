import { useRef, useState } from "react";
import { LuImage, LuTrash2, LuUpload } from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { useUploadMedia } from "@/lib/api/upload";
import { cn } from "@/lib/utils";

type UploadFolder =
  | "news"
  | "executives"
  | "events"
  | "chapters"
  | "patrons"
  | "gallery"
  | "programs"
  | "general";

interface ImageUploadFieldProps {
  label?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: UploadFolder;
  previewName?: string;
  accept?: "image" | "media";
  showUrlFallback?: boolean;
}

export function ImageUploadField({
  label = "Image",
  value,
  onChange,
  folder = "general",
  previewName = "?",
  accept = "image",
  showUrlFallback = true,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadMedia();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    if (accept === "image" && !file.type.startsWith("image/")) {
      errorToast("Please select an image file.", "Invalid file");
      return;
    }

    if (
      accept === "media" &&
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      errorToast("Please select an image or video file.", "Invalid file");
      return;
    }

    try {
      setUploading(true);
      const result = await uploadMedia.mutateAsync({ file, folder });
      onChange(result.url);
      successToast("File uploaded successfully.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Upload failed.",
        "Upload error",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isVideo = value?.includes("/video/") || value?.match(/\.(mp4|webm|mov)(\?|$)/i);

  return (
    <section className="min-w-0 rounded-xl border border-text-dark/10 bg-background/40 p-3 sm:p-4">
      <p className="mb-3 text-xs font-semibold text-text-dark">{label}</p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          {value && isVideo ? (
            <div className="flex h-24 w-36 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-2 ring-surface">
              <video src={value} className="h-full w-full object-cover" muted />
            </div>
          ) : (
            <Avatar
              className={cn(
                "h-24 w-24 ring-4 ring-surface",
                !value && "opacity-80",
              )}
            >
              <AvatarImage src={value ?? undefined} alt={previewName} />
              <AvatarFallback>{previewName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
              <Spinner label="" className="h-5 w-5" />
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={accept === "media" ? "image/*,video/*" : "image/*"}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-primary/10 font-semibold text-primary"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <LuUpload size={14} />
              {value ? "Replace file" : "Upload file"}
            </Button>
            {value ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 hover:text-rose-700"
                disabled={uploading}
                onClick={() => onChange(null)}
              >
                <LuTrash2 size={14} />
                Remove
              </Button>
            ) : null}
          </div>

          <p className="text-[11px] text-text-muted">
            {accept === "media"
              ? "Upload JPG, PNG, WEBP, MP4, or WEBM. Max 10 MB."
              : "Upload JPG, PNG, or WEBP. Max 10 MB."}
          </p>

          {showUrlFallback ? (
            <Input
              label="Or paste URL"
              placeholder="https://…"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value || null)}
              startContent={<LuImage size={14} className="text-text-muted" />}
              className="text-xs"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
