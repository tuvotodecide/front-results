import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import VerifyEmailPage from "@/domains/auth/components/VerifyEmailPage";

export default function VerifyEmailRoutePage() {
  return (
    <Suspense fallback={<LoadingSkeleton tone="brand" />}>
      <VerifyEmailPage />
    </Suspense>
  );
}
