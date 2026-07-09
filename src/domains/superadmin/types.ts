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
  createdAt: string;
  type: string;
  target: string;
  amount: string;
  status: string;
  txHash: string;
};

export type WalletTvdBalance = {
  wallet: string;
  balance: string;
  network: string;
  updatedAt: string;
};

export type InstitutionalRecoveryRequest = {
  id: string;
  institutionName: string;
  status: string;
  requestedAt: string;
};
