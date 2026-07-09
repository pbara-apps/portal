import { Navigate, Outlet } from "react-router-dom";
import { AdminShell } from "@/features/admin/components/layout/AdminShell";
import { AdminAuthGuard } from "@/features/admin/components/AdminAuthGuard";

export function AdminLayout() {
  return (
    <AdminShell>
      <AdminAuthGuard>
        <Outlet />
      </AdminAuthGuard>
    </AdminShell>
  );
}

export function AdminIndexRedirect() {
  return <Navigate to="/admin" replace />;
}
