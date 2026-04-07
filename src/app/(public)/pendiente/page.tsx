import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import WaitingApprovalPage from "@/domains/auth/components/WaitingApprovalPage";

export default function WaitingApprovalRoutePage() {
  return (
    <Suspense fallback={<LoadingSkeleton tone="brand" />}>
      <WaitingApprovalPage />
    </Suspense>
  );
}
