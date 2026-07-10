import type { IconType } from "react-icons";
import {
  LuAward,
  LuBriefcase,
  LuCalendar,
  LuImage,
  LuNetwork,
  LuNewspaper,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuUsers,
} from "react-icons/lu";
import type { AdminAuditEntry } from "@/types/admin";

export type AuditAction = AdminAuditEntry["action"];

export function eventTypeLabel(action: string, entityType: string) {
  const verb =
    action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  return `${verb} ${entityType}`;
}

export function formatActionPhrase(log: AdminAuditEntry) {
  const verb =
    log.action === "created"
      ? "Created"
      : log.action === "updated"
        ? "Updated"
        : "Deleted";
  return `${verb} ${log.entityType} “${log.entityTitle}”`;
}

const actionIcons: Record<AuditAction, IconType> = {
  created: LuPlus,
  updated: LuPencil,
  deleted: LuTrash2,
};

const entityIcons: Record<string, IconType> = {
  news: LuNewspaper,
  event: LuCalendar,
  gallery: LuImage,
  executive: LuUsers,
  chapter: LuNetwork,
  office: LuBriefcase,
  patron: LuAward,
};

const actionBubbleClass: Record<AuditAction, string> = {
  created: "bg-violet-500 text-white",
  updated: "bg-amber-400 text-amber-950",
  deleted: "bg-rose-500 text-white",
};

export function getAuditIcon(log: AdminAuditEntry): IconType {
  return entityIcons[log.entityType] ?? actionIcons[log.action];
}

export function getAuditBubbleClass(log: AdminAuditEntry): string {
  return actionBubbleClass[log.action];
}
