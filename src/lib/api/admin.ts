import { useMutation, useQuery } from "@tanstack/react-query";
import type { AdminDashboardStats } from "@/types/admin-dashboard";
import http from ".";

export const adminKeys = {
  dashboard: ["admin-dashboard"] as const,
  directorDesk: ["admin-director-desk"] as const,
};

export type AdminDirectorDeskPayload = {
  title?: string;
  description?: string;
  image?: string | null;
};

export const useGetAdminDashboard = () => {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: async () => {
      const res = await http.get("/admin/dashboard");
      return res.data as AdminDashboardStats;
    },
  });
};

export const useGetAdminDirectorDesk = () => {
  return useQuery({
    queryKey: adminKeys.directorDesk,
    queryFn: async () => {
      const res = await http.get("/admin/director-desk");
      return res.data;
    },
  });
};

export const useUpdateAdminDirectorDesk = () => {
  return useMutation({
    mutationFn: async (directorDesk: AdminDirectorDeskPayload) => {
      const res = await http.patch("/admin/director-desk", directorDesk);
      return res.data;
    },
  });
};

// export const useUpdateDirectorDesk = () => {
//   return useMutation({
//     mutationFn: async (directorDesk: DirectorDeskTypes) => {
//       const res = await http.patch("/admin/director-desk", directorDesk);
//       return res.data;
//     },
//   });
// };
