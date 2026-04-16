import type { ReactNode } from "react";

interface VotacionKioskLayoutProps {
  children: ReactNode;
}

export default function VotacionKioskLayout({
  children,
}: VotacionKioskLayoutProps) {
  return (
    <div data-domain="votacion" data-access="kiosk">
      {children}
    </div>
  );
}
