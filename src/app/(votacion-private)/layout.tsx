import type { ReactNode } from "react";
import VotacionPrivateGuard from "../../domains/votacion/guards/VotacionPrivateGuard";
import VotacionPrivateShell from "../../domains/votacion/layout/VotacionPrivateShell";

interface VotacionPrivateLayoutProps {
  children: ReactNode;
}

export default function VotacionPrivateLayout({
  children,
}: VotacionPrivateLayoutProps) {
  return (
    <VotacionPrivateGuard>
      <VotacionPrivateShell>{children}</VotacionPrivateShell>
    </VotacionPrivateGuard>
  );
}
