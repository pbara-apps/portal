import { useState } from "react";
import { LuMegaphone } from "react-icons/lu";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAnnouncements, useReadAnnouncement } from "../api/engagement";
import { formatDate } from "../lib/member-utils";

/** Announcements from the association. Opening one marks it as read. */
export default function AnnouncementsPage() {
  const { data: items = [], isLoading } = useAnnouncements();
  const markRead = useReadAnnouncement();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string, read: boolean) => {
    setOpenId((current) => (current === id ? null : id));
    if (!read) markRead.mutate(id);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Announcements</h1>
        <p className="mt-1 text-sm text-text-muted">Circulars and notices from the association.</p>
      </header>
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
          <LuMegaphone size={20} className="text-primary" />
          <p className="text-sm text-text-muted">No announcements yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className={cn("rounded-2xl border bg-surface", a.read ? "border-text-dark/5" : "border-gold/40")}>
              <button type="button" onClick={() => toggle(a.id, a.read)} className="flex w-full items-start gap-3 p-4 text-left">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.read ? "bg-transparent" : "bg-gold")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-primary">{a.title}</span>
                  <span className="block text-xs text-text-muted">{formatDate(a.createdAt)}{a.read ? "" : " · New"}</span>
                  {openId === a.id ? (
                    <span className="mt-3 block whitespace-pre-line text-sm text-text-dark">{a.body}</span>
                  ) : (
                    <span className="mt-1 line-clamp-1 block text-sm text-text-muted">{a.body}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
