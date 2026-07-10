import {
  institutionalRecoveryRequestsMock,
  publicRecoveryReceiptMock,
  tvdContractStatusMock,
  tvdEconomicParametersMock,
  tvdInstitutionsMock,
  tvdOperationsMock,
  walletTvdBalanceMock,
} from "../data/superadminTvd.mock";
import type {
  InstitutionalRecoveryRequest,
  PublicInstitutionalRecoveryDraft,
  PublicInstitutionalRecoveryReceipt,
  TvdAssignmentDraft,
  TvdAssignmentReceipt,
  TvdContractStatus,
  TvdEconomicParameters,
  TvdInstitution,
  TvdOperation,
  WalletTvdBalance,
} from "../types";
import { signTvdManualAssignment } from "./superadminWalletAdapter";

export const getTvdContractStatus = async (): Promise<TvdContractStatus> =>
  tvdContractStatusMock;

export const getTvdEconomicParameters =
  async (): Promise<TvdEconomicParameters> => tvdEconomicParametersMock;

export const getTvdInstitutions = async (): Promise<TvdInstitution[]> =>
  tvdInstitutionsMock;

export const createTvdManualAssignment = async (
  draft: TvdAssignmentDraft,
): Promise<TvdAssignmentReceipt> => signTvdManualAssignment(draft);

export const getTvdOperations = async (): Promise<TvdOperation[]> =>
  tvdOperationsMock;

export const getWalletTvdBalance = async (): Promise<WalletTvdBalance> =>
  walletTvdBalanceMock;

export const getInstitutionalRecoveryRequests = async (): Promise<
  InstitutionalRecoveryRequest[]
> => institutionalRecoveryRequestsMock;

export const approveInstitutionalRecoveryRequest = async (
  requestId: string,
  reviewerNote: string,
): Promise<InstitutionalRecoveryRequest> => {
  const request = institutionalRecoveryRequestsMock.find(
    (item) => item.id === requestId,
  );

  return {
    ...(request ?? institutionalRecoveryRequestsMock[0]),
    status: "Aprobada",
    reviewerNote,
  };
};

export const rejectInstitutionalRecoveryRequest = async (
  requestId: string,
  reviewerNote: string,
): Promise<InstitutionalRecoveryRequest> => {
  const request = institutionalRecoveryRequestsMock.find(
    (item) => item.id === requestId,
  );

  return {
    ...(request ?? institutionalRecoveryRequestsMock[0]),
    status: "Rechazada",
    reviewerNote,
  };
};

export const createInstitutionalRecoveryRequest = async (
  draft: PublicInstitutionalRecoveryDraft,
): Promise<PublicInstitutionalRecoveryReceipt> =>
  publicRecoveryReceiptMock(draft.institutionName, draft.newEmail);
