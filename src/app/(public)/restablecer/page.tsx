import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ResetPasswordPage from "@/domains/auth/components/ResetPasswordPage";

export default function ResetPasswordRoutePage() {
  return (
    <Suspense fallback={<LoadingSkeleton tone="brand" />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
