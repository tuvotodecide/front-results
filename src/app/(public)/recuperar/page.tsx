import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ForgotPasswordPage from "@/domains/auth/components/ForgotPasswordPage";

export default function ForgotPasswordRoutePage() {
  return (
    <Suspense fallback={<LoadingSkeleton tone="brand" />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
