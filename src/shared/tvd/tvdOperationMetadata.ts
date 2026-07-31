export type TvdOperationCategory =
  | "core"
  | "multisig"
  | "institution"
  | "incentive"
  | "economic"
  | "election"
  | "voting"
  | "reward"
  | "unknown";

export type TvdOperationAmountSign = "positive" | "negative" | "neutral";

export type TvdOperationMetadata = {
  label: string;
  category: TvdOperationCategory;
  amountSign: TvdOperationAmountSign;
};

const historyOperationMetadata: Record<string, TvdOperationMetadata> = {
  "Cambio del periodo de congelamiento para el bloque Core": {
    label: "Periodo de congelamiento actualizado",
    category: "core",
    amountSign: "neutral",
  },
  "Nuevo beneficiado para el bloque Core": {
    label: "Beneficiario agregado",
    category: "core",
    amountSign: "neutral",
  },
  "Beneficiado del bloque Core eliminado": {
    label: "Beneficiario retirado",
    category: "core",
    amountSign: "neutral",
  },
  "Acción multisig propuesto": {
    label: "Acción propuesta",
    category: "multisig",
    amountSign: "neutral",
  },
  "Acción multisig aprobado": {
    label: "Acción aprobada",
    category: "multisig",
    amountSign: "neutral",
  },
  "Aprobación multisig eliminado": {
    label: "Aprobación retirada",
    category: "multisig",
    amountSign: "neutral",
  },
  "Acción multisig ejecutado": {
    label: "Acción ejecutada",
    category: "multisig",
    amountSign: "neutral",
  },
  "Nuevo participante multisig": {
    label: "Firmante agregado",
    category: "multisig",
    amountSign: "neutral",
  },
  "Participante multisig eliminado": {
    label: "Firmante retirado",
    category: "multisig",
    amountSign: "neutral",
  },
  "Umbral multisig actualizado": {
    label: "Umbral de firmas actualizado",
    category: "multisig",
    amountSign: "neutral",
  },
  "Asignación institucional: Duración de bloqueo actualizado": {
    label: "Periodo institucional actualizado",
    category: "institution",
    amountSign: "neutral",
  },
  "Asignación institucional: Tokens asignados": {
    label: "Asignación institucional",
    category: "institution",
    amountSign: "positive",
  },
  "Asignación institucional: Tokens comprados": {
    label: "Recarga institucional",
    category: "institution",
    amountSign: "positive",
  },
  "Asignación institucional: Tokens reclamados": {
    label: "Tokens liberados",
    category: "institution",
    amountSign: "positive",
  },
  "Campaña de incentivo creada": {
    label: "Campaña de incentivo creada",
    category: "incentive",
    amountSign: "neutral",
  },
  "Campaña de incentivo pausada": {
    label: "Campaña de incentivo pausada",
    category: "incentive",
    amountSign: "neutral",
  },
  "Campaña de incentivo renaudada": {
    label: "Campaña de incentivo reanudada",
    category: "incentive",
    amountSign: "neutral",
  },
  "Incentivo otorgado": {
    label: "Incentivo otorgado",
    category: "incentive",
    amountSign: "positive",
  },
  "Incentivo reclamado": {
    label: "Incentivo reclamado",
    category: "incentive",
    amountSign: "positive",
  },
  "Institución creada": {
    label: "Institución creada",
    category: "institution",
    amountSign: "neutral",
  },
  "Institución: nueva wallet asignada": {
    label: "Nueva cuenta institucional",
    category: "institution",
    amountSign: "neutral",
  },
  "Institución: cambio de admin": {
    label: "Administrador actualizado",
    category: "institution",
    amountSign: "neutral",
  },
  "Porcentaje de quema actualizado": {
    label: "Porcentaje de quema actualizado",
    category: "economic",
    amountSign: "neutral",
  },
  "Valor de TVD por voto actualizado": {
    label: "Consumo por voto actualizado",
    category: "economic",
    amountSign: "neutral",
  },
  "Elección creada": {
    label: "Votación creada",
    category: "election",
    amountSign: "negative",
  },
  "Fechas de elección actualizadas": {
    label: "Fechas actualizadas",
    category: "election",
    amountSign: "neutral",
  },
  "Votantes registrados actualizados": {
    label: "Padrón actualizado",
    category: "election",
    amountSign: "neutral",
  },
  "Elección deshabilitada": {
    label: "Votación deshabilitada",
    category: "election",
    amountSign: "neutral",
  },
  "Voto emitido": {
    label: "Voto registrado",
    category: "voting",
    amountSign: "negative",
  },
  "Elección liquidada": {
    label: "Votación liquidada",
    category: "election",
    amountSign: "neutral",
  },
  "Recompensa por voto reclamada": {
    label: "Recompensa reclamada",
    category: "reward",
    amountSign: "positive",
  },
};

export const getTvdOperationMetadata = (
  operationName?: string | null,
): TvdOperationMetadata => {
  const key = String(operationName ?? "").trim();
  return (
    historyOperationMetadata[key] ?? {
      label: key || "Operación",
      category: "unknown",
      amountSign: "neutral",
    }
  );
};
