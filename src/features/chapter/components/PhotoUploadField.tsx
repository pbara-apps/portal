import { useRef } from "react";
import { LuTrash2, LuUpload } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { errorToast } from "@/components/shared/toast-notification";
import { useUploadMemberPhoto } from "../api/members";
import { MemberAvatar } from "./MemberAvatar";

const MAX_BYTES = 5 * 1024 * 1024;

/** Optional member photo. Without one, the association logo is shown. */
export function PhotoUploadField({
  value,
  name,
  onChange,
  compact = false,
}: {
  value: string | null;
  name: string;
  onChange: (url: string | null) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMemberPhoto();

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return errorToast("Please choose an image file.", "Photo");
    if (file.size > MAX_BYTES) return errorToast("The photo must be 5MB or smaller.", "Photo");
    try {
      onChange(await upload.mutateAsync(file));
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Upload failed.", "Photo");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <MemberAvatar photo={value} name={name || "Member"} size={compact ? 36 : 56} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        loading={upload.isPending}
        onClick={() => inputRef.current?.click()}
        aria-label={value ? "Change photo" : "Add photo"}
      >
        {!upload.isPending && <LuUpload size={14} />}
        {!compact && (value ? "Change" : "Add photo")}
      </Button>
      {value && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Remove photo"
          onClick={() => onChange(null)}
        >
          <LuTrash2 size={14} />
        </Button>
      )}
    </div>
  );
}
