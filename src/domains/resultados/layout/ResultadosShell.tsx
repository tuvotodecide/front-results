"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useScreenSize } from "../../../hooks/useScreenSize";
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
