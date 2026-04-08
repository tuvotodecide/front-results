import { Suspense } from "react";
import RegisterVotacionPage from "@/domains/auth-votacion/screens/RegisterVotacionPage";

export default function VotacionRegisterRoutePage() {
  return (
    <Suspense fallback={null}>
      <RegisterVotacionPage />
    </Suspense>
  );
}
