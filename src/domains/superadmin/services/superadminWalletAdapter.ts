import {
  mockAssignmentSourceWallet,
  mockAssignmentTxHash,
} from "../data/superadminTvd.mock";
import type { TvdAssignmentDraft, TvdAssignmentReceipt } from "../types";

const SIGNING_DELAY_MS = 450;

type EthereumWindow = Window & {
  ethereum?: unknown;
};

export const isMetaMaskAvailable = () =>
  typeof window !== "undefined" &&
  Boolean((window as EthereumWindow).ethereum);

export const signTvdManualAssignment = async (
  draft: TvdAssignmentDraft,
): Promise<TvdAssignmentReceipt> => {
  await new Promise((resolve) => window.setTimeout(resolve, SIGNING_DELAY_MS));

  return {
    ...draft,
    network: "Base L2",
    sourceWallet: mockAssignmentSourceWallet,
    txHash: mockAssignmentTxHash,
  };
};
