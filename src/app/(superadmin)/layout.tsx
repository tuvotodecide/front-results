import type { ReactNode } from "react";
import SuperadminGuard from "@/domains/superadmin/guards/SuperadminGuard";
import SuperadminShell from "@/domains/superadmin/layout/SuperadminShell";

export default function SuperadminRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SuperadminGuard>
      <SuperadminShell>{children}</SuperadminShell>
    </SuperadminGuard>
  );
}
