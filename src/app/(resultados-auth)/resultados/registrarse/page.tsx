import { Suspense } from "react";
import RegisterResultadosPage from "@/domains/auth-resultados/screens/RegisterResultadosPage";

export default function ResultadosRegisterRoutePage() {
  return (
    <Suspense fallback={null}>
      <RegisterResultadosPage />
    </Suspense>
  );
}
