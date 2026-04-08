import { Suspense } from "react";
import WaitingApprovalResultadosPage from "@/domains/auth-resultados/screens/WaitingApprovalResultadosPage";

export default function ResultadosPendingRoutePage() {
  return (
    <Suspense fallback={null}>
      <WaitingApprovalResultadosPage />
    </Suspense>
  );
}
