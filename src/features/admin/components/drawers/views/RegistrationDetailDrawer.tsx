import { SheetBody, SheetHeader } from "@/components/ui/sheet";
import { RegistrationDetailPanel } from "@/features/admin/components/registrations/RegistrationDetailPanel";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import { useDrawer } from "@/store/useDrawer";
import type { AdminRegistration } from "@/types/admin";

interface RegistrationDetailDrawerProps {
  registration?: AdminRegistration;
  canManage: boolean;
  onClose: () => void;
}

export function RegistrationDetailDrawer({
  registration,
  canManage,
}: RegistrationDetailDrawerProps) {
  const openDrawer = useDrawer((s) => s.openDrawer);

  return (
    <DrawerFormShell>
      <SheetHeader className="border-b border-text-dark/6 px-6 py-8">
        {/* <div className="min-w-0">
          <h2 className="mt-1 truncate text-lg font-semibold text-primary">
            Registration Detail
          </h2>
          {registration?.program?.title ? (
            <p className="mt-1 text-sm text-text-muted">
              {registration.program.title}
            </p>
          ) : null}
        </div> */}
      </SheetHeader>
      <SheetBody className="px-6 py-5">
        <RegistrationDetailPanel
          registration={registration ?? null}
          canManage={canManage}
          onUpdated={(updated) =>
            openDrawer("view-registration", {
              body: updated,
              config: { size: "3xl" },
            })
          }
        />
      </SheetBody>
    </DrawerFormShell>
  );
}
