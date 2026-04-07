"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import DomainLayout from "@/shared/layout/DomainLayout";
import PublicLandingHeader from "@/features/publicLanding/components/PublicLandingHeader";
import ResultsSidebar from "@/shared/layout/ResultsSidebar";
import { useScreenSize } from "@/hooks/useScreenSize";
import styles from "./ResultsShell.module.css";

interface ResultsShellProps {
  children: ReactNode;
}

export default function ResultsShell({ children }: Readonly<ResultsShellProps>) {
  const { isSmallScreen } = useScreenSize();
  const [isSidebarOpen, setSidebarOpen] = useState(!isSmallScreen);

  useEffect(() => {
    setSidebarOpen(!isSmallScreen);
  }, [isSmallScreen]);

  const toggleSidebar = () => {
    setSidebarOpen((value) => !value);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <DomainLayout domain="results">
      <div className={styles.shell}>
        <PublicLandingHeader
          showMenuToggle
          isSidebarOpen={isSidebarOpen}
          onToggleMenu={toggleSidebar}
        />

        <div className={styles.body}>
          <main className={styles.content}>{children}</main>
          <ResultsSidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
        </div>
      </div>
    </DomainLayout>
  );
}
