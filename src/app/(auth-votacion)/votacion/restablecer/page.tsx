import { Suspense } from "react";
import ResetPasswordVotacionPage from "@/domains/auth-votacion/screens/ResetPasswordVotacionPage";

export default function VotacionResetPasswordRoutePage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordVotacionPage />
    </Suspense>
  );
}
