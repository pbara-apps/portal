import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChapterSession } from "../store/useChapterSession";

/**
 * Lets a counsellor switch between their church's chapters (or view all).
 * Presidents and secretaries have one chapter, so they just see its name.
 */
export function ChapterSwitcher({ allowAll = true }: { allowAll?: boolean }) {
  const profile = useChapterSession((s) => s.profile);
  const selected = useChapterSession((s) => s.selectedChapterId);
  const selectChapter = useChapterSession((s) => s.selectChapter);
  const chapters = profile?.chapters ?? [];

  if (profile?.role !== "counsellor") {
    return <p className="text-sm font-semibold text-primary">{chapters[0]?.name ?? "My chapter"}</p>;
  }

  const value = !allowAll && selected === "all" ? (chapters[0]?.id ?? "") : selected;

  return (
    <Select value={value} onValueChange={(v) => selectChapter(v)}>
      <SelectTrigger className="w-full sm:w-64" aria-label="Chapter">
        <SelectValue placeholder="Select chapter" />
      </SelectTrigger>
      <SelectContent>
        {allowAll && chapters.length > 1 && <SelectItem value="all">All chapters</SelectItem>}
        {chapters.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
