import { useCallback, useEffect, useRef, useState } from "react";

export type InstitutionalVestingBalance = {
  raw: string;
  decimals: number;
  formatted: string;
  readAt: string;
};

type InstitutionalVestingBalanceState = {
  data: InstitutionalVestingBalance | null;
  error: Error | null;
  isLoading: boolean;
};

const INSTITUTIONAL_VESTING_BALANCE_URL = "/api/tvd/institutional-vesting-balance";

export const useInstitutionalVestingBalance = () => {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<InstitutionalVestingBalanceState>({
    data: null,
    error: null,
    isLoading: true,
  });

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((previous) => ({ ...previous, isLoading: true }));

    try {
      const response = await fetch(INSTITUTIONAL_VESTING_BALANCE_URL, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload?.data?.raw) {
        throw new Error(
          payload?.message ??
            "No se pudo leer el saldo del vesting institucional.",
        );
      }
      if (requestIdRef.current !== requestId) return;
      setState({
        data: {
          raw: String(payload.data.raw),
          decimals: Number(payload.data.decimals ?? 18),
          formatted: String(payload.data.formatted ?? ""),
          readAt: String(payload.data.readAt ?? ""),
        },
        error: null,
        isLoading: false,
      });
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setState({
        data: null,
        error: error instanceof Error ? error : new Error("Vesting balance error"),
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refetch: load };
};
