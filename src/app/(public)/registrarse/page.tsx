import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import RegisterPage from "@/domains/auth/components/RegisterPage";

export default function RegisterRoutePage() {
  return (
    <Suspense fallback={<LoadingSkeleton tone="brand" />}>
      <RegisterPage />
    </Suspense>
  );
}
