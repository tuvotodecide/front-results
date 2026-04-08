import type { ReactNode } from "react";
import AuthResultadosShell from "../../domains/auth-resultados/layout/AuthResultadosShell";

interface ResultadosAuthLayoutProps {
  children: ReactNode;
}

export default function ResultadosAuthLayout({
  children,
}: ResultadosAuthLayoutProps) {
  return <AuthResultadosShell>{children}</AuthResultadosShell>;
}
