import type { ReactNode } from "react";
import VotacionGuardBoundary from "../../domains/votacion/guards/VotacionGuardBoundary";
import VotacionPublicShell from "../../domains/votacion/layout/VotacionPublicShell";

interface VotacionPublicLayoutProps {
  children: ReactNode;
}

export default function VotacionPublicLayout({
  children,
}: VotacionPublicLayoutProps) {
  return (
    <VotacionGuardBoundary access="public">
      <VotacionPublicShell>{children}</VotacionPublicShell>
    </VotacionGuardBoundary>
  );
}
