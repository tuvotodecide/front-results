import { Suspense } from "react";
import LoginVotacionPage from "@/domains/auth-votacion/screens/LoginVotacionPage";

export default function VotacionLoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginVotacionPage />
    </Suspense>
  );
}
