import { Suspense } from "react";
import VerifyVotacionPage from "@/domains/auth-votacion/screens/VerifyVotacionPage";

export default function VotacionVerifyRoutePage() {
  return (
    <Suspense fallback={null}>
      <VerifyVotacionPage />
    </Suspense>
  );
}
