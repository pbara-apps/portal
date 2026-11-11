import { useState } from "react";
import { useAddMembers } from "../api/members";
import { useChapterSession, useWorkingChapter } from "../store/useChapterSession";
import { AddMembersDrawer } from "./AddMembersDrawer";
import { ChapterField } from "./ChapterField";

/**
 * Chapter portal "Add members" drawer. Counsellors pick one of their
 * church's chapters; presidents and secretaries add to their own.
 */
export function ChapterAddMembersDrawer({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const chapters = useChapterSession((s) => s.profile?.chapters) ?? [];
  const working = useWorkingChapter();
  const addMembers = useAddMembers();
  const [pickedId, setPickedId] = useState<string | null>(null);

  const chapterId = pickedId ?? working.chapterId;
  const chapter = chapters.find((c) => c.id === chapterId) ?? null;

  return (
    <AddMembersDrawer
      open={open}
      onClose={() => {
        setPickedId(null);
        onClose();
      }}
      chapter={chapter}
      chapterField={<ChapterField label="Adding to" chapterId={chapterId} onChange={setPickedId} />}
      description="New members wait for the association's approval before they count. Only a name and rank are needed."
      save={async (id, members) => {
        await addMembers.mutateAsync({ chapterId: id, members });
        onSaved?.();
      }}
      saving={addMembers.isPending}
    />
  );
}
