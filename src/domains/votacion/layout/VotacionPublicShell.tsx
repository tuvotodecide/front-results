"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import VotacionPublicHeader from "./VotacionPublicHeader";

interface VotacionPublicShellProps {
  children: ReactNode;
}

export default function VotacionPublicShell({
  children,
}: VotacionPublicShellProps) {
  const searchParams = useSearchParams();
  // Con ?hideLogin=true la cabecera no se renderiza, así que no hay que compensar su altura
  const headerOffset = searchParams?.get("hideLogin") === "true" ? 0 : "64px";

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
      <Suspense fallback={null}>
        <VotacionPublicHeader />
      </Suspense>
      <main
        style={{
          marginTop: headerOffset,
          flex: 1,
        }}
      >
        {children}
      </main>
    </div>
  );
}
