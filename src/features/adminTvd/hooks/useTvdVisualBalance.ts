import { useCallback, useEffect, useRef, useState } from "react";
import {
  readTvdOnChainBalance,
  type TvdOnChainBalance,
  type TvdVisualBalanceError,
} from "../services/tvdOnChainBalance";

type TvdVisualBalanceState = {
  data: TvdOnChainBalance | null;
  error: TvdVisualBalanceError | Error | null;
  isLoading: boolean;
};

export const useTvdVisualBalance = (
  walletAddress: string | null | undefined,
  assignmentContractAddress?: string | null,
  chainId?: number | null,
  contextKey?: string,
) => {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<TvdVisualBalanceState>({
    data: null,
    error: null,
    isLoading: false,
  });

  const load = useCallback(async () => {
    const wallet = walletAddress?.trim();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!wallet) {
      setState({ data: null, error: null, isLoading: false });
      return;
    }

    setState({ data: null, error: null, isLoading: true });
    try {
      const nextData = await readTvdOnChainBalance(
        wallet,
        assignmentContractAddress,
        chainId,
      );
      if (requestIdRef.current === requestId) {
        setState({ data: nextData, error: null, isLoading: false });
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setState({
          data: null,
          error: error instanceof Error ? error : new Error("Balance error"),
          isLoading: false,
        });
      }
    }
  }, [assignmentContractAddress, chainId, walletAddress]);

  useEffect(() => {
    setState({ data: null, error: null, isLoading: false });
    void load();
  }, [contextKey, load]);

  return {
    ...state,
    refetch: load,
  };
};
