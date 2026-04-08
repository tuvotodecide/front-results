import { Suspense } from "react";
import type { ReactNode } from "react";
import ResultadosPrivateGuard from "../../domains/resultados/guards/ResultadosPrivateGuard";
import ResultadosShell from "../../domains/resultados/layout/ResultadosShell";

interface ResultadosPrivateLayoutProps {
  children: ReactNode;
}

export default function ResultadosPrivateLayout({
  children,
}: ResultadosPrivateLayoutProps) {
  return (
    <Suspense fallback={null}>
      <ResultadosPrivateGuard>
        <ResultadosShell access="private">{children}</ResultadosShell>
      </ResultadosPrivateGuard>
    </Suspense>
  );
}
