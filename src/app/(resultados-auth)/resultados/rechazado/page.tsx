import { Suspense } from "react";
import RejectedResultadosPage from "@/domains/auth-resultados/screens/RejectedResultadosPage";

export default function ResultadosRejectedRoutePage() {
  return (
    <Suspense fallback={null}>
      <RejectedResultadosPage />
    </Suspense>
  );
}
