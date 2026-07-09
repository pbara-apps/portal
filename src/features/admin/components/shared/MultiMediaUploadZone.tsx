import { useRef, useState } from "react";
import { LuImage, LuUpload, LuVideo } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface MultiMediaUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

export function MultiMediaUploadZone({
  onFilesSelected,
  disabled = false,
  maxFiles = 50,
  className,
}: MultiMediaUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length || disabled) return;

    const files = Array.from(fileList).filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    if (files.length === 0) return;
    onFilesSelected(files.slice(0, maxFiles));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-text-dark/15 bg-background/40 hover:border-primary/40",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-3 px-6 py-10 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LuUpload size={24} aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-dark">
            Drop files here or click to browse
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Upload up to {maxFiles} photos or videos at once
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span className="inline-flex items-center gap-1">
            <LuImage size={12} aria-hidden />
            JPG, PNG, WEBP
          </span>
          <span className="text-text-dark/20">|</span>
          <span className="inline-flex items-center gap-1">
            <LuVideo size={12} aria-hidden />
            MP4, WEBM
          </span>
          <span className="text-text-dark/20">|</span>
          <span>Max 10 MB each</span>
        </div>
      </button>
    </div>
  );
}
