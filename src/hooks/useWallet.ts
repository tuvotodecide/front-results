type DisabledWalletState = "disabled";
type DisabledTransactionState = "idle" | "error";

const disabledError = () =>
  new Error("La publicacion oficial se gestiona desde el backend.");

export const useWallet = () => {
  return {
    account: null as string | null,
    connectionState: "disabled" as DisabledWalletState,
    transactionState: "idle" as DisabledTransactionState,
    error: null as string | null,
    connectWallet: async () => {
      throw disabledError();
    },
    callUpdateSchedule: async () => {
      throw disabledError();
    },
    resetTransactionState: () => undefined,
  };
};
