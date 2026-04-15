import type { ReactNode } from "react";
import AccessApprovalsGuard from "@/domains/access-approvals/guards/AccessApprovalsGuard";
import VotacionPublicHeader from "@/domains/votacion/layout/VotacionPublicHeader";

export default function ApprovalsPrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AccessApprovalsGuard>
      <div data-domain="approvals" data-access="private">
        <VotacionPublicHeader />
        <div style={{ paddingTop: "64px" }}>{children}</div>
      </div>
    </AccessApprovalsGuard>
  );
}
