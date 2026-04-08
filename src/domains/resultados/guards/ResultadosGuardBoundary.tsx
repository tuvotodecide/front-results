"use client";

interface ResultadosGuardBoundaryProps {
  children: React.ReactNode;
  access: "public" | "private";
}

export default function ResultadosGuardBoundary({
  children,
}: ResultadosGuardBoundaryProps) {
  return <>{children}</>;
}
