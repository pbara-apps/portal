import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type AdminAccount, useAvailableExecutives } from "@/lib/api/accounts";

const NONE = "__none__";

/** Links an admin account to an executive profile (needed for finance access). */
export function LinkExecutiveDialog({
  account,
  saving,
  onClose,
  onSave,
}: {
  account: AdminAccount | null;
  saving: boolean;
  onClose: () => void;
  onSave: (executiveId: string | null) => void;
}) {
  const { data: executives = [], isLoading } = useAvailableExecutives(Boolean(account));
  const [value, setValue] = useState(NONE);

  useEffect(() => {
    setValue(account?.admin.executiveId ?? NONE);
  }, [account]);

  if (!account) return null;
  const current = account.admin.executive;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Linked executive</DialogTitle>
          <DialogDescription>
            Link {account.name}'s login to their executive profile. Unlinking also removes finance access.
          </DialogDescription>
        </DialogHeader>
        <Select value={value} onValueChange={setValue} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Pick an executive" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Not linked</SelectItem>
            {current && account.admin.executiveId && (
              <SelectItem value={account.admin.executiveId}>
                {current.name}
                {current.office ? ` · ${current.office}` : ""} (current)
              </SelectItem>
            )}
            {executives.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
                {e.office ? ` · ${e.office}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => onSave(value === NONE ? null : value)}
            loading={saving}
            disabled={(value === NONE ? null : value) === account.admin.executiveId}
            className="bg-primary text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
