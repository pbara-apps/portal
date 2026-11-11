import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddMembersDrawer } from "@/features/chapter/components/AddMembersDrawer";
import { useAdminAddMembers, useAdminChapters, useAdminUploadMemberPhoto } from "@/lib/api/chapter-admin";

/**
 * Admin "Add members" drawer (super admins and admins): pick a church and
 * chapter, then add members. They go to the Recruitment Board as pending.
 */
export function AdminAddMembersDrawer({
  open,
  defaultChapterId,
  onClose,
}: {
  open: boolean;
  /** Preselects a chapter, e.g. the Members page's chapter filter. */
  defaultChapterId?: string;
  onClose: () => void;
}) {
  const { data: chapters = [], isLoading } = useAdminChapters();
  const addMembers = useAdminAddMembers();
  const photoUploader = useAdminUploadMemberPhoto();
  const [pickedChapterId, setPickedChapterId] = useState<string | null>(null);
  const [pickedChurchId, setPickedChurchId] = useState("");

  const chapterId = pickedChapterId ?? defaultChapterId ?? "";
  const chapter = chapters.find((c) => c.id === chapterId) ?? null;
  // The church follows the chosen chapter, so a preselected chapter fills both.
  const churchId = chapter?.church?.id ?? pickedChurchId;

  const churches = useMemo(() => {
    const byId = new Map<string, string>();
    for (const c of chapters) if (c.church) byId.set(c.church.id, c.church.name);
    return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [chapters]);
  const chapterOptions = chapters.filter((c) => c.church?.id === churchId);

  const pickChurch = (id: string) => {
    setPickedChurchId(id);
    // A church with one chapter needs no second choice.
    const own = chapters.filter((c) => c.church?.id === id);
    setPickedChapterId(own.length === 1 ? own[0].id : "");
  };

  const close = () => {
    setPickedChapterId(null);
    setPickedChurchId("");
    onClose();
  };

  return (
    <AddMembersDrawer
      open={open}
      onClose={close}
      chapter={chapter}
      chapterField={
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Church" required value={churchId} onValueChange={pickChurch} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading…" : "Choose a church"} />
            </SelectTrigger>
            <SelectContent>
              {churches.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            label="Chapter"
            required
            value={chapterId}
            onValueChange={setPickedChapterId}
            disabled={!churchId}
          >
            <SelectTrigger>
              <SelectValue placeholder={churchId ? "Choose a chapter" : "Choose a church first"} />
            </SelectTrigger>
            <SelectContent>
              {chapterOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      description="New members go to the Recruitment Board and count once a super admin approves them. The chapter's officers are told."
      submitLabel="to the Recruitment Board"
      save={(id, members) => addMembers.mutateAsync({ chapterId: id, members })}
      saving={addMembers.isPending}
      photoUploader={photoUploader}
    />
  );
}
