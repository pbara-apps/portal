import { mapRegistration } from "@/lib/mappers/admin";
import type {
  AdminProgram,
  AdminRegistration,
  ProgramParticipantRow,
  RegistrationListParams,
  RegistrationStatus,
} from "@/types/admin";
import http from "@/lib/api";

export async function fetchAllRegistrations(
  params: Omit<RegistrationListParams, "page" | "limit"> = {},
): Promise<AdminRegistration[]> {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const items: AdminRegistration[] = [];

  while (page <= totalPages) {
    const res = await http.get("/registration/", {
      params: { ...params, page, limit },
    });
    const payload = res.data as {
      items?: unknown[];
      totalPages?: number;
    };
    const pageItems = (payload.items ?? []).map((item) =>
      mapRegistration(item as Parameters<typeof mapRegistration>[0]),
    );
    items.push(...pageItems);
    totalPages = Math.max(1, payload.totalPages ?? 1);
    page += 1;
    if (page > 50) break;
  }

  return items;
}

export function flattenRegistrationParticipants(
  registrations: AdminRegistration[],
): ProgramParticipantRow[] {
  const rows: ProgramParticipantRow[] = [];

  for (const registration of registrations) {
    registration.entries.forEach((entry, index) => {
      rows.push({
        id: `${registration.id}-${index}`,
        registrationId: registration.id,
        participantName: entry.name,
        registrationCode: entry.registrationCode,
        rankName: entry.rankName,
        churchName: entry.churchName,
        churchChapter: entry.churchChapter,
        registrantName: registration.registrantName,
        registrantPhone: registration.registrantPhone,
        status: registration.status,
        submittedAt: registration.createdAt,
        registrationType: registration.registrationType,
      });
    });
  }

  return rows.sort((a, b) => {
    const byName = a.participantName.localeCompare(b.participantName);
    if (byName !== 0) return byName;
    return a.submittedAt.localeCompare(b.submittedAt);
  });
}

/** Counts participants (entries) per programId across all fetched registrations. */
export function countParticipantsByProgramId(
  registrations: AdminRegistration[],
  options?: { status?: RegistrationStatus | "all" },
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const registration of registrations) {
    if (
      options?.status &&
      options.status !== "all" &&
      registration.status !== options.status
    ) {
      continue;
    }
    const key = registration.programId;
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + registration.entries.length;
  }
  return counts;
}

/** Counts participants per program category label. */
export function countParticipantsByCategory(
  programs: AdminProgram[],
  countsByProgramId: Record<string, number>,
): { category: string; participants: number; programs: number }[] {
  const map = new Map<string, { participants: number; programs: number }>();
  for (const program of programs) {
    const category = program.category || "Uncategorized";
    const current = map.get(category) ?? { participants: 0, programs: 0 };
    current.programs += 1;
    current.participants += countsByProgramId[program.id] ?? 0;
    map.set(category, current);
  }
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, ...value }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
