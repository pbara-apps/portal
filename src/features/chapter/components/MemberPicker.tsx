import { useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PortalMember } from "../types";
import { MemberAvatar } from "./MemberAvatar";
import { MemberStatusBadge } from "./MemberStatusBadge";

/**
 * Searchable multi-select list of members. Search matches name or member ID.
 * Members in `disabledIds` are shown but can't be picked (with `disabledReason`).
 */
export function MemberPicker({
  members,
  selected,
  onChange,
  disabledIds,
  disabledReason = "Not available",
  showChapter = false,
  showStatus = false,
  maxHeight = "22rem",
}: {
  members: PortalMember[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  disabledIds?: Set<string>;
  disabledReason?: string;
  showChapter?: boolean;
  showStatus?: boolean;
  maxHeight?: string;
}) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.fullName.toLowerCase().includes(q) || (m.memberId ?? "").toLowerCase().includes(q),
    );
  }, [members, search]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search by name or member ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        startContent={<LuSearch size={16} />}
      />
      <p className="text-xs text-text-muted">
        {selected.size} selected · {visible.length} shown
      </p>
      <ul className="overflow-y-auto rounded-xl border border-text-dark/10" style={{ maxHeight }}>
        {visible.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-text-muted">No members match your search.</li>
        ) : (
          visible.map((m) => {
            const disabled = disabledIds?.has(m.id) ?? false;
            return (
              <li key={m.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border-b border-text-dark/5 px-3 py-2.5 last:border-0 hover:bg-background/60",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Checkbox
                    checked={selected.has(m.id)}
                    disabled={disabled}
                    onCheckedChange={() => !disabled && toggle(m.id)}
                    aria-label={`Select ${m.fullName}`}
                  />
                  <MemberAvatar photo={m.photo} name={m.fullName} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-dark">{m.fullName}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {[m.memberId ?? "Pending approval", m.rank?.name, showChapter ? m.chapter?.name : null]
                        .filter(Boolean)
                        .join(" · ")}
                      {disabled ? ` · ${disabledReason}` : ""}
                    </span>
                  </span>
                  {showStatus && <MemberStatusBadge member={m} />}
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
