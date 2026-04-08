import { Suspense } from "react";
import ResultadosGeneralesPage from "@/domains/resultados/screens/ResultadosGeneralesPage";

export default function ResultadosPage() {
  return (
    <Suspense fallback={null}>
      <ResultadosGeneralesPage />
    </Suspense>
  );
}
