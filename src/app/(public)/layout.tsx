import type { ReactNode } from "react";
import { Suspense } from "react";
import AuthAccessBoundary from "@/shared/auth/AuthAccessBoundary";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import DomainLayout from "@/shared/layout/DomainLayout";
import PublicLandingHeader from "@/features/publicLanding/components/PublicLandingHeader";
import ResultsShell from "@/shared/layout/ResultsShell";

const readServerAppMode = () => {
  const configuredMode =
    process.env.NEXT_PUBLIC_APP_MODE ?? process.env.VITE_APP_MODE ?? "voting";

  return String(configuredMode).trim().toLowerCase() === "results"
    ? "results"
    : "voting";
};

export default function PublicLayoutGroup({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  if (readServerAppMode() === "results") {
    return (
      <ResultsShell>
        <Suspense fallback={<LoadingSkeleton tone="surface" />}>
          <AuthAccessBoundary mode="public">
            {children}
          </AuthAccessBoundary>
        </Suspense>
      </ResultsShell>
    );
  }

  return (
    <DomainLayout domain="public">
      <PublicLandingHeader />
      <Suspense fallback={<LoadingSkeleton tone="brand" />}>
        <AuthAccessBoundary mode="public">
          {children}
        </AuthAccessBoundary>
      </Suspense>
    </DomainLayout>
  );
}
