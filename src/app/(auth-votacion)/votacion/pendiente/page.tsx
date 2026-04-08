import { Suspense } from "react";
import PendingVotacionPage from "@/domains/auth-votacion/screens/PendingVotacionPage";

export default function VotacionPendingRoutePage() {
  return (
    <Suspense fallback={null}>
      <PendingVotacionPage />
    </Suspense>
  );
}
