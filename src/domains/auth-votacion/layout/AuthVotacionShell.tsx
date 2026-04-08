import type { ReactNode } from "react";
import AuthVotacionHeader from "./AuthVotacionHeader";

interface AuthVotacionShellProps {
  children: ReactNode;
}

export default function AuthVotacionShell({
  children,
}: AuthVotacionShellProps) {
  return (
    <div
      data-domain="auth-votacion"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      <AuthVotacionHeader />
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
