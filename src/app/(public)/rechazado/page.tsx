import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import RejectedPage from "@/domains/auth/components/RejectedPage";

export default function RejectedRoutePage() {
  return (
    <Suspense fallback={<LoadingSkeleton tone="brand" />}>
      <RejectedPage />
    </Suspense>
  );
}
