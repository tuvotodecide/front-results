import type { ReactNode } from "react";
import ResultsShell from "@/shared/layout/ResultsShell";

export default function ResultsLayoutGroup({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <ResultsShell>{children}</ResultsShell>;
}
