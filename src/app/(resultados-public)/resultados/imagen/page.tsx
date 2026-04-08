import { Suspense } from "react";
import ResultadosImagenPage from "@/domains/resultados/screens/ResultadosImagenPage";

export default function ResultadosImagenRoutePage() {
  return (
    <Suspense fallback={null}>
      <ResultadosImagenPage />
    </Suspense>
  );
}
