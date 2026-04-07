import type { ReactNode } from "react";
import { Suspense } from "react";
import AuthAccessBoundary from "@/shared/auth/AuthAccessBoundary";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import DomainLayout from "@/shared/layout/DomainLayout";

export default function InstitutionalPrivateLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={<LoadingSkeleton tone="surface" />}>
      <AuthAccessBoundary mode="institutional-private">
        <DomainLayout domain="institutional-private">{children}</DomainLayout>
      </AuthAccessBoundary>
    </Suspense>
  );
}
