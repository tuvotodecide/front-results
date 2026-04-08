import { Suspense } from "react";
import ResultadosImagenPage from "@/domains/resultados/screens/ResultadosImagenPage";

export default function ResultadosImagenDetailRoutePage() {
  return (
    <Suspense fallback={null}>
      <ResultadosImagenPage />
    </Suspense>
  );
}
