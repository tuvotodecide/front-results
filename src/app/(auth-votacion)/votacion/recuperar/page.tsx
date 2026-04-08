import { Suspense } from "react";
import ForgotPasswordVotacionPage from "@/domains/auth-votacion/screens/ForgotPasswordVotacionPage";

export default function VotacionForgotPasswordRoutePage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordVotacionPage />
    </Suspense>
  );
}
