import { useEffect, useState } from "react";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useSetRankHistory } from "../api/members";
import { toDateInput } from "../lib/member-utils";
import type { PortalMember, PortalRank } from "../types";
import { FileUploadButton } from "./FileUploadButton";

type Row = { reached: boolean; dateReached: string; proofUrl: string | null };

/**
 * Edit a member's rank progress: tick each rank they have reached and,
 * optionally, add the date and a proof file. The highest ticked rank
 * becomes their current rank. No approval is needed.
 */
export function RankProgressDrawer({
  member,
  ranks,
  open,
  onClose,
}: {
  member: PortalMember;
  ranks: PortalRank[];
  open: boolean;
  onClose: () => void;
}) {
  const save = useSetRankHistory();
  const [rows, setRows] = useState<Record<string, Row>>({});

  useEffect(() => {
    if (!open) return;
    const fromHistory = new Map(member.rankHistory.map((h) => [h.rank.id, h]));
    const next: Record<string, Row> = {};
    for (const rank of ranks) {
      const h = fromHistory.get(rank.id);
      next[rank.id] = {
        reached: Boolean(h) || rank.id === member.rank?.id,
        dateReached: toDateInput(h?.dateReached),
        proofUrl: h?.proofUrl ?? null,
      };
    }
    setRows(next);
  }, [open, member, ranks]);

  const update = (rankId: string, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [rankId]: { ...r[rankId], ...patch } }));
  const reachedCount = ranks.filter((rank) => rows[rank.id]?.reached).length;

  const handleSave = async () => {
    const entries = ranks
      .filter((rank) => rows[rank.id]?.reached)
      .map((rank) => ({
        rankId: rank.id,
        dateReached: rows[rank.id].dateReached || null,
        proofUrl: rows[rank.id].proofUrl,
      }));
    if (entries.length === 0) return errorToast("Tick at least one rank.", "Rank progress");
    try {
      await save.mutateAsync({ id: member.id, entries });
      successToast("Rank progress saved.");
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  return (
    <FormDrawer
      open={open}
      size="lg"
      title={`Rank progress — ${member.fullName}`}
      description="Tick every rank reached. Date and proof are optional. The highest ticked rank becomes the current rank."
      onSubmit={handleSave}
      onCancel={onClose}
      submitting={save.isPending}
      submitLabel="Save progress"
      footerStart={<p className="text-sm text-muted">{reachedCount} of {ranks.length} ranks reached</p>}
    >
      <ol className="divide-y divide-separator rounded-xl border border-border">
        {ranks.map((rank, index) => {
          const row = rows[rank.id];
          if (!row) return null;
          return (
            <li key={rank.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <Checkbox checked={row.reached} onCheckedChange={(v) => update(rank.id, { reached: v === true })} />
                <span className="text-sm">
                  <span className="mr-2 text-xs tabular-nums text-muted">{index + 1}.</span>
                  {rank.name}
                </span>
              </label>
              {row.reached ? (
                <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                  <Input
                    type="date"
                    aria-label={`Date reached ${rank.name}`}
                    value={row.dateReached}
                    onChange={(e) => update(rank.id, { dateReached: e.target.value })}
                    className="w-40"
                  />
                  <FileUploadButton
                    purpose="rank-proof"
                    value={row.proofUrl}
                    onChange={(url) => update(rank.id, { proofUrl: url })}
                    label="Proof"
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </FormDrawer>
  );
}
