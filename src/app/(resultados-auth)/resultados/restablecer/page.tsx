import { Suspense } from "react";
import ResetPasswordResultadosPage from "@/domains/auth-resultados/screens/ResetPasswordResultadosPage";

export default function ResultadosResetRoutePage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordResultadosPage />
    </Suspense>
  );
}
