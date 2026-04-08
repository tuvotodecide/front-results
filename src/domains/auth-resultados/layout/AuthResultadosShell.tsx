import type { ReactNode } from "react";
import AuthResultadosHeader from "./AuthResultadosHeader";

interface AuthResultadosShellProps {
  children: ReactNode;
}

export default function AuthResultadosShell({
  children,
}: AuthResultadosShellProps) {
  return (
    <div
      data-domain="auth-resultados"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      <AuthResultadosHeader />
      <main
        style={{
          marginTop: "64px",
          flex: 1,
        }}
      >
        {children}
      </main>
    </div>
  );
}
