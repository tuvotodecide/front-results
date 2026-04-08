import { Suspense } from "react";
import LoginResultadosPage from "@/domains/auth-resultados/screens/LoginResultadosPage";

export default function ResultadosLoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginResultadosPage />
    </Suspense>
  );
}
