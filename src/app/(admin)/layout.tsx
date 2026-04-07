import type { ReactNode } from "react";
import { Suspense } from "react";
import AuthAccessBoundary from "@/shared/auth/AuthAccessBoundary";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import DomainLayout from "@/shared/layout/DomainLayout";

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={<LoadingSkeleton tone="surface" />}>
      <AuthAccessBoundary mode="admin">
        <DomainLayout domain="admin">{children}</DomainLayout>
      </AuthAccessBoundary>
    </Suspense>
  );
}
