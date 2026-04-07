"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetPublicActiveContractsQuery } from "../store/contracts/contractsEndpoints";
import { normalizeResultsElectionType } from "@/domains/results/lib/queryParams";
import { useBrowserSearchParams } from "@/shared/routing/browserLocation";
import {
  selectFilterIds,
  selectFilters,
} from "../store/resultados/resultadosSlice";
import { selectIsLoggedIn } from "../store/auth/authSlice";

interface UsePublicResultsScopeParams {
  electionId?: string;
  electionType?: string;
}

export function usePublicResultsScope({
  electionId,
  electionType,
}: UsePublicResultsScopeParams) {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const filterIds = useSelector(selectFilterIds);
  const filters = useSelector(selectFilters);
  const searchParams = useBrowserSearchParams();

  const normalizedElectionType = useMemo(
    () => normalizeResultsElectionType(electionType),
    [electionType],
  );

  const { data: publicContractsData, isLoading } = useGetPublicActiveContractsQuery(
    electionId
      ? {
          electionId,
          electionType: normalizedElectionType,
        }
      : undefined,
    {
      skip: isLoggedIn || !electionId,
    },
  );

  return useMemo(() => {
    if (isLoggedIn) {
      return {
        isPublic: false,
        isLoading: false,
        hasContracts: false,
        isScopeValid: true,
        reason: null as string | null,
      };
    }

    const contracts = publicContractsData?.data ?? [];
    if (!electionId) {
      return {
        isPublic: true,
        isLoading,
        hasContracts: false,
        isScopeValid: false,
        reason: "Seleccione una elección válida.",
      };
    }

    if (contracts.length === 0) {
      return {
        isPublic: true,
        isLoading,
        hasContracts: false,
        isScopeValid: false,
        reason: "No hay contratos públicos para esta elección.",
      };
    }

    const departmentId =
      filterIds.departmentId || searchParams.get("department") || "";
    const municipalityId =
      filterIds.municipalityId || searchParams.get("municipality") || "";
    const departmentName = filters.department || "";
    const municipalityName = filters.municipality || "";

    const allowedDepartments = new Set(
      contracts
        .filter((contract) => contract.territory.type === "department")
        .map((contract) => contract.territory.departmentId)
        .filter(Boolean),
    );
    const allowedMunicipalities = new Set(
      contracts
        .filter((contract) => contract.territory.type === "municipality")
        .map((contract) => contract.territory.municipalityId)
        .filter(Boolean),
    );

    if (normalizedElectionType === "municipal" && allowedMunicipalities.size > 0) {
      const isScopeValid = Boolean(
        municipalityId && allowedMunicipalities.has(municipalityId),
      );
      return {
        isPublic: true,
        isLoading,
        hasContracts: true,
        isScopeValid,
        reason: isScopeValid
          ? null
          : municipalityName || departmentName
            ? "No hay resultados públicos disponibles para este municipio."
            : "Seleccione un municipio habilitado para ver resultados.",
      };
    }

    if (normalizedElectionType === "departamental" && allowedDepartments.size > 0) {
      const isScopeValid = Boolean(
        departmentId && allowedDepartments.has(departmentId),
      );
      return {
        isPublic: true,
        isLoading,
        hasContracts: true,
        isScopeValid,
        reason: isScopeValid
          ? null
          : departmentName
            ? "No hay resultados públicos disponibles para este departamento."
            : "Seleccione un departamento habilitado para ver resultados.",
      };
    }

    return {
      isPublic: true,
      isLoading,
      hasContracts: true,
      isScopeValid: true,
      reason: null as string | null,
    };
  }, [
    electionId,
    filterIds.departmentId,
    filterIds.municipalityId,
    filters.department,
    filters.municipality,
    isLoading,
    isLoggedIn,
    normalizedElectionType,
    publicContractsData?.data,
    searchParams,
  ]);
}
