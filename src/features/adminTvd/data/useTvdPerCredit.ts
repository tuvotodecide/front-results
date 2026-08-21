import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits } from "ethers";

export type TvdPerCreditValue = {
  /** Costo de 1 participante en la unidad más pequeña (18 decimales). */
  raw: string;
  decimals: number;
  /** Costo de 1 participante ya legible, ej. "1 TVD". */
  formatted: string;
};

const TVD_PER_CREDIT_URL = "/api/tvd/tvd-per-credit";

// El parámetro cambia muy rara vez: se cachea por sesión de pestaña para no
// repetir la lectura on-chain en cada montaje del wizard o del modal.
let cachedValue: TvdPerCreditValue | null = null;

const trimAmount = (value: string) =>
  value.includes(".") ? value.replace(/0+$/, "").replace(/\.$/, "") : value;

/** Costo total, en la unidad más pequeña, de `participants` participantes. */
export const getRequiredSmallestUnit = (
  participants: number | string,
  tvdPerCredit: TvdPerCreditValue | null,
): bigint | null => {
  if (!tvdPerCredit) return null;
  const normalized = String(participants).trim();
  if (!/^\d+$/.test(normalized)) return null;
  try {
    return BigInt(normalized) * BigInt(tvdPerCredit.raw);
  } catch {
    return null;
  }
};

/** Igual que `getRequiredSmallestUnit`, pero formateado como "1234 TVD". */
export const formatRequiredTvd = (
  participants: number | string,
  tvdPerCredit: TvdPerCreditValue | null,
): string | null => {
  const required = getRequiredSmallestUnit(participants, tvdPerCredit);
  if (required === null || !tvdPerCredit) return null;
  return `${trimAmount(formatUnits(required, tvdPerCredit.decimals))} TVD`;
};

export const formatSmallestUnitAsTvd = (
  smallestUnit: string | null | undefined,
  decimals: number,
): string | null => {
  const normalized = String(smallestUnit ?? "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  try {
    return `${trimAmount(formatUnits(BigInt(normalized), decimals))} TVD`;
  } catch {
    return null;
  }
};

export const fetchTvdPerCredit = async (): Promise<TvdPerCreditValue> => {
  if (cachedValue) return cachedValue;

  const response = await fetch(TVD_PER_CREDIT_URL, { cache: "no-store" });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload?.data?.raw) {
    throw new Error(
      payload?.message ??
        "No se pudo leer el costo por participante desde la blockchain.",
    );
  }

  cachedValue = {
    raw: String(payload.data.raw),
    decimals: Number(payload.data.decimals ?? 18),
    formatted: String(payload.data.formatted ?? ""),
  };
  return cachedValue;
};

export const useTvdPerCredit = () => {
  const [tvdPerCredit, setTvdPerCredit] = useState<TvdPerCreditValue | null>(
    cachedValue,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedValue);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (cachedValue) {
      setTvdPerCredit(cachedValue);
      setIsLoading(false);
      return cachedValue;
    }

    setIsLoading(true);
    try {
      const value = await fetchTvdPerCredit();
      if (mountedRef.current) {
        setTvdPerCredit(value);
        setError(null);
      }
      return value;
    } catch (loadError: unknown) {
      if (mountedRef.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo leer el costo por participante desde la blockchain.",
        );
      }
      return null;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { tvdPerCredit, isLoading, error, reload: load };
};
