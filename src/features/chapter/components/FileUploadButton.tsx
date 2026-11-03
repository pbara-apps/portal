import { useRef } from "react";
import { LuFileText, LuTrash2, LuUpload } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { errorToast } from "@/components/shared/toast-notification";
import { type UploadPurpose, useUploadFile } from "../api/members";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload one image or PDF (max 5MB) and keep its URL. Shows a link once uploaded. */
export function FileUploadButton({
  purpose,
  value,
  onChange,
  label = "Upload proof",
}: {
  purpose: UploadPurpose;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFile(purpose);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return errorToast("Choose an image or a PDF.", "Upload");
    }
    if (file.size > MAX_BYTES) return errorToast("The file must be 5MB or smaller.", "Upload");
    try {
      onChange(await upload.mutateAsync(file));
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Upload failed.", "Upload");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <>
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline">
            <LuFileText size={14} /> View file
          </a>
          <Button type="button" size="icon" variant="ghost" aria-label="Remove file" onClick={() => onChange(null)}>
            <LuTrash2 size={14} />
          </Button>
        </>
      ) : (
        <Button type="button" size="sm" variant="outline" loading={upload.isPending} onClick={() => inputRef.current?.click()}>
          {!upload.isPending && <LuUpload size={14} />} {label}
        </Button>
      )}
    </div>
  );
}
