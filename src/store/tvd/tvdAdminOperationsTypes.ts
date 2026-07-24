export const tvdAdminOperationTypes = [
  "MANUAL_ASSIGNMENT",
  "QR_RECHARGE",
  "VOTE_CONSUMPTION",
] as const;

export type TvdAdminOperationType = (typeof tvdAdminOperationTypes)[number];

export const tvdAdminOperationStatuses = [
  "PENDING",
  "PROCESSING",
  "CONFIRMED",
  "FAILED",
  "CANCELLED",
  "NEEDS_REVIEW",
] as const;

export type TvdAdminOperationStatus =
  (typeof tvdAdminOperationStatuses)[number];

export type TvdOperationDirection = "IN" | "OUT" | "NEUTRAL";

export type TvdAdminOperationSource = "TOKEN_ACCREDITATION" | "HISTORY";

export type TvdAdminOperationTotalBucket = "ASSIGNED" | "CONSUMED" | "NONE";

export const tvdAdminOperationLabels: Record<TvdAdminOperationType, string> = {
  MANUAL_ASSIGNMENT: "Asignación manual",
  QR_RECHARGE: "Recarga mediante QR",
  VOTE_CONSUMPTION: "Consumo por voto",
};

export const tvdAdminOperationStatusLabels: Record<
  TvdAdminOperationStatus,
  string
> = {
  PENDING: "Pendiente",
  PROCESSING: "En proceso",
  CONFIRMED: "Confirmada",
  FAILED: "Fallida",
  CANCELLED: "Cancelada",
  NEEDS_REVIEW: "Requiere revisión",
};

export const allInstitutionsOptionLabel = "Todas las instituciones";

export type TvdAdminOperationsFilters = {
  tenantId?: string;
  status?: TvdAdminOperationStatus;
  operationType?: TvdAdminOperationType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type TvdInstitutionOption = {
  label: string;
  value: string;
};

export type TvdAdminOperation = {
  id: string;
  tenantId: string;
  institutionName: string;
  operationType: TvdAdminOperationType;
  operationLabel: string;
  economicDirection: TvdOperationDirection;
  status: TvdAdminOperationStatus;
  statusLabel: string;
  amount: string | null;
  amountSmallestUnit: string | null;
  txHash: string | null;
  date: string;
  explorerUrl: string | null;
  source: TvdAdminOperationSource;
};

export type TvdAdminOperationsSummary = {
  totalOperations: number;
  totalAssigned: string;
  totalConsumed: string;
};

export type TvdAdminOperationsResponse = {
  items: TvdAdminOperation[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  summary: TvdAdminOperationsSummary;
};

export type TvdAdminOperationAccountingInput = {
  operationType: TvdAdminOperationType;
  status: TvdAdminOperationStatus;
  tenantId?: string | null;
  amount?: string | null;
  amountSmallestUnit?: string | null;
};

const tvdAdminOperationTotalBuckets: Record<
  TvdAdminOperationType,
  TvdAdminOperationTotalBucket
> = {
  MANUAL_ASSIGNMENT: "ASSIGNED",
  QR_RECHARGE: "ASSIGNED",
  VOTE_CONSUMPTION: "CONSUMED",
};

const hasVerifiableAmount = ({
  amount,
  amountSmallestUnit,
}: TvdAdminOperationAccountingInput) =>
  Boolean(amountSmallestUnit && amountSmallestUnit !== "0") ||
  Boolean(amount && amount !== "0");

export const getTvdAdminOperationTotalBucket = (
  operation: TvdAdminOperationAccountingInput,
): TvdAdminOperationTotalBucket => {
  if (
    operation.status !== "CONFIRMED" ||
    !operation.tenantId ||
    !hasVerifiableAmount(operation)
  ) {
    return "NONE";
  }

  return tvdAdminOperationTotalBuckets[operation.operationType];
};
