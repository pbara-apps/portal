import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import chapterHttp from "./http";

/** A program open for registration (as returned by /chapter-portal/programs). */
export interface OpenProgram {
  id: string;
  title: string;
  category: string;
  description: string | null;
  flyerImageUrl: string | null;
  amount: number;
  registrationMode: "single" | "bulk" | "both";
  registrationDeadline: string | null;
  bankDetails: { bankName: string; accountName: string; accountNumber: string };
}

export interface ChapterRegistration {
  id: string;
  program: { id: string; title: string; amount: number } | null;
  status: "pending" | "verified" | "rejected";
  adminNote: string | null;
  createdAt: string;
  entries: {
    name: string;
    registrationCode: string;
    rankName: string;
    membership: "member" | "pending" | "non_member" | null;
  }[];
}

const keys = {
  programs: ["chapter-portal", "programs"] as const,
  registered: (programId: string, chapterId: string) =>
    ["chapter-portal", "registered", programId, chapterId] as const,
  registrations: (chapterId?: string) => ["chapter-portal", "registrations", chapterId ?? "all"] as const,
};

type RawProgram = Omit<OpenProgram, "id"> & { _id: string };

export const useOpenPrograms = () =>
  useQuery({
    queryKey: keys.programs,
    queryFn: async () => {
      const res = await chapterHttp.get("/programs");
      return ((res.data ?? []) as RawProgram[]).map(({ _id, ...p }): OpenProgram => ({ id: _id, ...p }));
    },
  });

/** Members of a chapter already registered for a program (so they can't be picked again). */
export const useRegisteredMemberIds = (programId?: string, chapterId?: string) =>
  useQuery({
    queryKey: keys.registered(programId ?? "", chapterId ?? ""),
    enabled: Boolean(programId && chapterId),
    queryFn: async () => {
      const res = await chapterHttp.get(`/programs/${programId}/registered`, { params: { chapterId } });
      return new Set((res.data ?? []) as string[]);
    },
  });

export const useRegisterMembers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      programId: string;
      chapterId: string;
      memberIds: string[];
      proofOfPaymentUrl: string;
    }) => {
      await chapterHttp.post("/registrations", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapter-portal", "registered"] });
      qc.invalidateQueries({ queryKey: ["chapter-portal", "registrations"] });
    },
  });
};

type RawRegistration = {
  _id: string;
  programId?: { _id: string; title: string; amount: number } | null;
  status: ChapterRegistration["status"];
  adminNote?: string | null;
  createdAt: string;
  entries: { name: string; registrationCode: string; rank?: { name?: string } | null; membership?: ChapterRegistration["entries"][number]["membership"] }[];
};

export const useChapterRegistrations = (chapterId?: string) =>
  useQuery({
    queryKey: keys.registrations(chapterId),
    queryFn: async () => {
      const res = await chapterHttp.get("/registrations", { params: { chapterId } });
      return ((res.data ?? []) as RawRegistration[]).map(
        (r): ChapterRegistration => ({
          id: r._id,
          program: r.programId ? { id: r.programId._id, title: r.programId.title, amount: r.programId.amount } : null,
          status: r.status,
          adminNote: r.adminNote ?? null,
          createdAt: r.createdAt,
          entries: r.entries.map((e) => ({
            name: e.name,
            registrationCode: e.registrationCode,
            rankName: e.rank?.name ?? "",
            membership: e.membership ?? null,
          })),
        }),
      );
    },
  });
