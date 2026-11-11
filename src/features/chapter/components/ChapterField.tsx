import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChapterSession } from "../store/useChapterSession";

/**
 * The chapter a drawer form works on. Counsellors with several chapters
 * pick one; everyone else sees their chapter's name.
 */
export function ChapterField({
  chapterId,
  onChange,
  label = "Chapter",
}: {
  chapterId: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const profile = useChapterSession((s) => s.profile);
  const chapters = profile?.chapters ?? [];
  const name = chapters.find((c) => c.id === chapterId)?.name;

  if (profile?.role !== "counsellor" || chapters.length < 2) {
    return (
      <p className="rounded-lg bg-surface-secondary px-3 py-2.5 text-sm text-muted">
        {label}: <span className="font-semibold text-foreground">{name ?? "Your chapter"}</span>
      </p>
    );
  }

  return (
    <Select label={label} required value={chapterId} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Choose a chapter" />
      </SelectTrigger>
      <SelectContent>
        {chapters.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
