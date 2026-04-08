import type { ReactNode } from "react";
import VotacionPublicHeader from "./VotacionPublicHeader";

interface VotacionPrivateShellProps {
  children: ReactNode;
}

export default function VotacionPrivateShell({
  children,
}: VotacionPrivateShellProps) {
  return (
    <div
      data-domain="votacion"
      data-access="private"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      <VotacionPublicHeader />
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
