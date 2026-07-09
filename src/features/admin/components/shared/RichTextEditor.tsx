import { lazy, Suspense, useMemo } from "react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "link"],
  ["clean"],
];

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function EditorFallback() {
  return (
    <div className="rich-text-editor">
      <div className="h-[42px] animate-pulse rounded-t-lg border border-text-dark/15 bg-background/40" />
      <div className="min-h-[200px] animate-pulse rounded-b-lg border border-t-0 border-text-dark/15 bg-background/40" />
    </div>
  );
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write article content…",
  minHeight = 200,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
    }),
    [],
  );

  const formats = useMemo(
    () => ["header", "bold", "italic", "underline", "list", "bullet", "blockquote", "link"],
    [],
  );

  return (
    <div className="rich-text-editor flex flex-col gap-1.5">
      {label ? <span className="text-xs font-semibold text-text-dark">{label}</span> : null}
      <div style={{ ["--editor-min-height" as string]: `${minHeight}px` }}>
        <Suspense fallback={<EditorFallback />}>
          <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
          />
        </Suspense>
      </div>
    </div>
  );
}
