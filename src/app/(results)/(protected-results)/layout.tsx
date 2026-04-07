import type { ReactNode } from "react";
import { Suspense } from "react";
import AuthAccessBoundary from "@/shared/auth/AuthAccessBoundary";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function ProtectedResultsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={<LoadingSkeleton tone="surface" />}>
      <AuthAccessBoundary mode="results">{children}</AuthAccessBoundary>
    </Suspense>
  );
}
