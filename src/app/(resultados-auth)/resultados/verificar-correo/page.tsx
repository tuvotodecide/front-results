import { Suspense } from "react";
import VerifyResultadosPage from "@/domains/auth-resultados/screens/VerifyResultadosPage";

export default function ResultadosVerifyRoutePage() {
  return (
    <Suspense fallback={null}>
      <VerifyResultadosPage />
    </Suspense>
  );
}
