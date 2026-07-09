import {
  institutionalRecoveryRequestsMock,
  tvdContractStatusMock,
  tvdEconomicParametersMock,
  tvdInstitutionsMock,
  tvdOperationsMock,
  walletTvdBalanceMock,
} from "../data/superadminTvd.mock";
import type {
  InstitutionalRecoveryRequest,
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
