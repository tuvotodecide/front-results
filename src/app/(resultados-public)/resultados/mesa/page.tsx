import { Suspense } from "react";
import ResultadosMesaPage from "@/domains/resultados/screens/ResultadosMesaPage";

export default function ResultadosMesaRoutePage() {
  return (
    <Suspense fallback={null}>
      <ResultadosMesaPage />
    </Suspense>
  );
}
