import { Suspense } from "react";
import type { ReactNode } from "react";
import ResultadosGuardBoundary from "../../domains/resultados/guards/ResultadosGuardBoundary";
import ResultadosShell from "../../domains/resultados/layout/ResultadosShell";

interface ResultadosPublicLayoutProps {
  children: ReactNode;
}

export default function ResultadosPublicLayout({
  children,
}: ResultadosPublicLayoutProps) {
  return (
    <ResultadosGuardBoundary access="public">
      <Suspense fallback={null}>
        <ResultadosShell access="public">{children}</ResultadosShell>
      </Suspense>
    </ResultadosGuardBoundary>
  );
}
