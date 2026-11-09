import { Navigate, Outlet } from "react-router-dom";
import { AdminShell } from "@/features/admin/components/layout/AdminShell";
import { AdminAuthGuard } from "@/features/admin/components/AdminAuthGuard";

/** Signed-out visitors are redirected before the shell (and its data requests) loads. */
export function AdminLayout() {
  return (
    <AdminAuthGuard>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminAuthGuard>
  );
}

export function AdminIndexRedirect() {
  return <Navigate to="/admin" replace />;
}
