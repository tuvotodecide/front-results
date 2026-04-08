"use client";

import type { ReactNode } from "react";
import VotacionPublicHeader from "./VotacionPublicHeader";

interface VotacionPublicShellProps {
  children: ReactNode;
}

export default function VotacionPublicShell({
  children,
}: VotacionPublicShellProps) {
  return (
    <div
      data-domain="votacion"
      data-access="public"
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
