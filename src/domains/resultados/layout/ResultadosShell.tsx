"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useScreenSize } from "../../../hooks/useScreenSize";
import { useSearchParams } from "../navigation/compat";
import { MainContent } from "../../../components/MainContent";
import ResultadosHeader from "./ResultadosHeader";
import ResultadosSidebar from "./ResultadosSidebar";

interface ResultadosShellProps {
  children: ReactNode;
  access: "public" | "private" | "auth";
}

export default function ResultadosShell({
  children,
  access,
}: ResultadosShellProps) {
  const { isSmallScreen, isScreenSizeReady } = useScreenSize();
  const [searchParams] = useSearchParams();
  // Con ?hideLogin=true la cabecera no se renderiza, así que no hay que compensar su altura
  const headerOffset =
    searchParams.get("hideLogin") === "true" ? "0px" : "64px";
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const hasSyncedInitialSidebar = useRef(false);

  useEffect(() => {
    if (!isScreenSizeReady || hasSyncedInitialSidebar.current) {
      return;
    }

    setSidebarOpen(!isSmallScreen);
    hasSyncedInitialSidebar.current = true;
  }, [isSmallScreen, isScreenSizeReady]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isSmallScreen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      data-domain="resultados"
      data-access={access}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        ["--sidebar-width" as string]:
          !isSmallScreen && isSidebarOpen ? "280px" : "0px",
        ["--header-offset" as string]: headerOffset,
      }}
    >
      <ResultadosHeader
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <MainContent>{children}</MainContent>
        <ResultadosSidebar
          isOpen={isSidebarOpen}
          closeSidebar={closeSidebar}
        />
      </div>
    </div>
  );
}
