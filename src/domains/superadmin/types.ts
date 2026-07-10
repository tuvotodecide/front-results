import type { ReactNode } from "react";

export type SuperadminNavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  description?: string;
};

export type TvdFund = {
  name: string;
  initialDistribution: string;
  initialAmount: string;
  currentDistribution: string;
  currentAmount: string;
  address: string;
};

export type TvdSigner = {
  label: string;
  address: string;
};

export type TvdContractStatus = {
  network: string;
  contractAddress: string;
  deploymentTxHash: string;
  registeredAt: string;
  explorerBaseUrl: string;
  multisigAddress: string;
  approvalThreshold: string;
  signers: TvdSigner[];
  funds: TvdFund[];
};

export type TvdEconomicParameter = {
  id: string;
  name: string;
  value: string;
  example: string;
};

export type TvdEconomicParameters = {
  blockchainUrl: string;
  parameters: TvdEconomicParameter[];
  rewards: {
    enabled: boolean;
    title: string;
    description: string;
  };
  initialCampaign: {
    enabled: boolean;
    title: string;
    description: string;
  };
};

export type TvdInstitutionStatus = "Validada" | "Pendiente";

export type TvdInstitution = {
  id: string;
  name: string;
  wallet: string;
  status: TvdInstitutionStatus;
};

export type TvdAssignmentDraft = {
  institution: TvdInstitution;
  amount: string;
  reason: string;
  auditedContext: string;
  destinationWallet: string;
  sourceFund: string;
};

export type TvdAssignmentReceipt = TvdAssignmentDraft & {
  txHash: string;
  network: string;
  sourceWallet: string;
};

export type TvdOperation = {
  id: string;
  type: "Asignación manual" | "Consumo por voto" | "Quema" | "Recompensa votante" | "Recarga";
  institution: string;
  amount: string;
  date: string;
  txHash: string;
  explorerUrl: string;
};

export type TvdOperationsSummary = {
  totalOperations: number;
  totalAssigned: string;
  totalConsumed: string;
};

export type WalletTvdBalance = {
  wallet: string;
  shortWallet: string;
  balance: string;
  network: string;
  belongsToEcosystem: boolean;
  explorerUrl: string;
  updatedAt: string;
};

export type InstitutionalRecoveryStatus =
  | "Pendiente"
  | "Aprobada"
  | "Rechazada";

export type InstitutionalRecoveryRequest = {
  id: string;
  institutionName: string;
  reason: string;
  previousAdminEmail: string;
  newAdminEmail: string;
  requestedAt: string;
  contactPhone: string;
  status: InstitutionalRecoveryStatus;
  reviewerNote?: string;
};

export type PublicInstitutionalRecoveryDraft = {
  institutionName: string;
  fullName: string;
  phone: string;
  newEmail: string;
  supervisorContact: string;
};

export type PublicInstitutionalRecoveryReceipt = {
  id: string;
  institutionName: string;
  contactEmail: string;
  status: string;
  createdAt: string;
};
