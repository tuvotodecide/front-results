import { Suspense } from "react";
import ForgotPasswordResultadosPage from "@/domains/auth-resultados/screens/ForgotPasswordResultadosPage";

export default function ResultadosForgotRoutePage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordResultadosPage />
    </Suspense>
  );
}
