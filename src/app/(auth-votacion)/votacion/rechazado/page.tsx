import { Suspense } from "react";
import RejectedVotacionPage from "@/domains/auth-votacion/screens/RejectedVotacionPage";

export default function VotacionRejectedRoutePage() {
  return (
    <Suspense fallback={null}>
      <RejectedVotacionPage />
    </Suspense>
  );
}
