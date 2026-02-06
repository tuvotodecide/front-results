import { useMemo } from 'react';
import {
  useGetLiveCountedBallotsQuery,
  useGetFinalCountedBallotsQuery,
} from '../store/resultados/resultadosEndpoints';
import { ballotsToElectoralTables } from '../utils/ballotToElectoralTable';
import { ElectoralTableType } from '../types';

interface UseCountedBallotsParams {
  electionType: string;
  electionId?: string;
  department?: string;
  province?: string;
  municipality?: string;
  page?: number;
  limit?: number;
  isLiveMode: boolean;
  skip?: boolean;
}

interface UseCountedBallotsResult {
  tables: ElectoralTableType[];
  ballots: any[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  mode: string;
}

/**
 * Hook para obtener los ballots que realmente cuentan en los resultados.
 * Usa los endpoints /results/live/ballots o /results/final/ballots
 * según el modo (live o final).
 */
export const useCountedBallots = ({
  electionType,
  electionId,
  department,
  province,
  municipality,
  page = 1,
  limit = 20,
  isLiveMode,
  skip = false,
}: UseCountedBallotsParams): UseCountedBallotsResult => {
  // Query params
  const queryParams = {
    electionType,
    electionId,
    department,
    province,
    municipality,
    page,
    limit,
  };

  // Use live or final endpoint based on mode
  const {
    data: liveData,
    isLoading: liveLoading,
    isError: liveError,
  } = useGetLiveCountedBallotsQuery(queryParams, {
    skip: skip || !isLiveMode || !electionType,
  });

  const {
    data: finalData,
    isLoading: finalLoading,
    isError: finalError,
  } = useGetFinalCountedBallotsQuery(queryParams, {
    skip: skip || isLiveMode || !electionType,
  });

  // Select the appropriate data based on mode
  const data = isLiveMode ? liveData : finalData;
  const isLoading = isLiveMode ? liveLoading : finalLoading;
  const isError = isLiveMode ? liveError : finalError;

  // Convert ballots to electoral tables for display
  const tables = useMemo(() => {
    if (!data?.data || data.data.length === 0) return [];
    return ballotsToElectoralTables(data.data);
  }, [data?.data]);

  return {
    tables,
    ballots: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    isError,
    mode: data?.mode ?? (isLiveMode ? 'live' : 'final'),
  };
};
