import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { errorToast, successToast } from "@/components/shared/toast-notification";
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
export function RankProgressDialog({
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rank progress — {member.fullName}</DialogTitle>
          <DialogDescription>
            Tick every rank reached. Date and proof are optional. The highest ticked rank becomes the current rank.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-text-dark/5 rounded-xl border border-text-dark/10">
          {ranks.map((rank, index) => {
            const row = rows[rank.id];
            if (!row) return null;
            return (
              <li key={rank.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <Checkbox checked={row.reached} onCheckedChange={(v) => update(rank.id, { reached: v === true })} />
                  <span className="text-sm">
                    <span className="mr-2 text-xs text-text-muted">{index + 1}.</span>
                    {rank.name}
                  </span>
                </label>
                {row.reached && (
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
                )}
              </li>
            );
          })}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={save.isPending} className="bg-primary text-white">Save progress</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
