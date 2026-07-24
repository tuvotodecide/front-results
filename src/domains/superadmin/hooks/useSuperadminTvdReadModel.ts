"use client";

import { useEffect, useState } from "react";
import type {
  HistoryContractsData,
  TvdContractsReadModel,
  TvdParametersReadModel,
} from "@/shared/tvd/superadminTvdTypes";
import {
  readTvdEconomicParameters,
} from "@/shared/tvd/superadminTvdReadService";
import { useGetHistoryContractsQuery } from "@/store/contracts/contractsEndpoints";

type FetchState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

const initialState = <T,>(): FetchState<T> => ({
  data: null,
  isLoading: true,
  error: null,
});

const getBackendErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return `No fue posible obtener el registro de contratos${
      typeof status === "number" || typeof status === "string" ? ` (${status})` : ""
    }.`;
  }
  return "No fue posible obtener el registro de contratos.";
};

const useTvdBlockchainReadModel = <T,>(
  reader: (contracts: HistoryContractsData) => Promise<T>,
) => {
  const contractsQuery = useGetHistoryContractsQuery();
  const [state, setState] = useState<FetchState<T>>(initialState<T>);
  const contracts = contractsQuery.data?.data ?? null;

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (contractsQuery.isLoading || contractsQuery.isFetching) {
        setState((current) => ({ ...current, isLoading: true, error: null }));
        return;
      }
      if (contractsQuery.error) {
        setState({
          data: null,
          isLoading: false,
          error: getBackendErrorMessage(contractsQuery.error),
        });
        return;
      }
      if (!contracts) {
        setState({
          data: null,
          isLoading: false,
          error: "No fue posible obtener el registro de contratos.",
        });
        return;
      }

      setState((current) => ({ ...current, isLoading: true, error: null }));
      try {
        const payload = await reader(contracts);
        if (active) {
          setState({ data: payload, isLoading: false, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            data: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Los contratos se obtuvieron, pero no fue posible consultar la blockchain.",
          });
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [
    contracts,
    contractsQuery.error,
    contractsQuery.isFetching,
    contractsQuery.isLoading,
    reader,
  ]);

  return state;
};

export const useTvdContractsReadModel = () =>
  useInternalTvdContractsReadModel();

export const useTvdParametersReadModel = () =>
  useTvdBlockchainReadModel<TvdParametersReadModel>(readTvdEconomicParameters);

const useInternalTvdContractsReadModel = () => {
  const [state, setState] = useState<FetchState<TvdContractsReadModel>>(
    initialState<TvdContractsReadModel>,
  );

  const load = async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/superadmin/tvd/contracts", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: TvdContractsReadModel;
        message?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(
          payload.message ??
            `No fue posible obtener los datos del contrato (${response.status}).`,
        );
      }
      setState({ data: payload.data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "No fue posible obtener los datos del contrato $TVD.",
      });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return { ...state, retry: load };
};
