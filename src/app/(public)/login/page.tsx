import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LoginPage from "@/domains/auth/components/LoginPage";

export default function LoginRoutePage() {
  return (
    <Suspense fallback={<LoadingSkeleton tone="brand" />}>
      <LoginPage />
    </Suspense>
  );
}
