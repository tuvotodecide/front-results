"use client";

import type { ReactNode } from "react";

interface VotacionGuardBoundaryProps {
  children: ReactNode;
  access: "public" | "private";
}

export default function VotacionGuardBoundary({
  children,
}: VotacionGuardBoundaryProps) {
  return <>{children}</>;
}
