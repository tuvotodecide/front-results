import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../store/auth/authSlice";
import { useGetMyActiveContractQuery } from "../store/reports/clientReportEndpoints";
import { useGetMyElectionsQuery } from "../store/contracts/contractsEndpoints";

export type ContractStatus =
  | "loading"
  | "no_auth" // No está logueado
  | "not_client" // Logueado pero no es MAYOR/GOVERNOR
  | "no_contracts" // Es cliente pero no tiene ningún contrato
  | "all_inactive" // Tiene contratos pero todos inactivos
  | "has_active"; // Tiene al menos un contrato activo

export interface UseMyContractResult {
  status: ContractStatus;
  hasContract: boolean;
  contract: {
    id: string;
    electionId: string;
    role: "MAYOR" | "GOVERNOR";
    territory: {
      type: "municipality" | "department";
      departmentId?: string;
      departmentName?: string;
      municipalityId?: string;
      municipalityName?: string;
    };
    active: boolean;
  } | null;
  elections: {
    electionId: string;
    electionName: string;
    isActive: boolean;
    hasActiveContract: boolean;
  }[];
  isLoading: boolean;
  isError: boolean;
  isClient: boolean;
}

export function useMyContract(): UseMyContractResult {
  const { user, token } = useSelector(selectAuth);

  const isLoggedIn = !!token && !!user;
  const isClient =
    isLoggedIn && (user?.role === "MAYOR" || user?.role === "GOVERNOR");

  // Query para obtener todas las elecciones del cliente
  const {
    data: electionsData,
    isLoading: electionsLoading,
    isError: electionsError,
  } = useGetMyElectionsQuery(undefined, {
    skip: !isClient,
  });

  // Query para obtener el contrato activo actual
  const {
    data: activeContractData,
    isLoading: activeContractLoading,
    isError: activeContractError,
  } = useGetMyActiveContractQuery(
    {},
    {
      skip: !isClient,
    }
  );

  const isLoading = electionsLoading || activeContractLoading;
  const isError = electionsError || activeContractError;

  const result = useMemo((): UseMyContractResult => {
    // Caso 1: No está logueado
    if (!isLoggedIn) {
      return {
        status: "no_auth",
        hasContract: false,
        contract: null,
        elections: [],
        isLoading: false,
        isError: false,
        isClient: false,
      };
    }

    // Caso 2: Logueado pero no es cliente (MAYOR/GOVERNOR)
    if (!isClient) {
      return {
        status: "not_client",
        hasContract: false,
        contract: null,
        elections: [],
        isLoading: false,
        isError: false,
        isClient: false,
      };
    }

    // Caso 3: Cargando datos
    if (isLoading) {
      return {
        status: "loading",
        hasContract: false,
        contract: null,
        elections: [],
        isLoading: true,
        isError: false,
        isClient: true,
      };
    }

    // Procesar elecciones disponibles
    const elections = (electionsData ?? []).map((e) => ({
      electionId: e.electionId,
      electionName: e.electionName,
      isActive: e.isActive,
      hasActiveContract: e.contracts.some((c) => c.active),
    }));

    // Caso 4: No tiene ningún contrato
    if (!electionsData || electionsData.length === 0) {
      return {
        status: "no_contracts",
        hasContract: false,
        contract: null,
        elections: [],
        isLoading: false,
        isError,
        isClient: true,
      };
    }

    // Caso 5: Tiene contratos pero ninguno activo
    const hasAnyActiveContract = electionsData.some((e) =>
      e.contracts.some((c) => c.active)
    );

    if (!hasAnyActiveContract) {
      return {
        status: "all_inactive",
        hasContract: false,
        contract: null,
        elections,
        isLoading: false,
        isError,
        isClient: true,
      };
    }

    // Caso 6: Tiene contrato activo
    const contract = activeContractData?.contract ?? null;

    return {
      status: "has_active",
      hasContract: !!contract,
      contract,
      elections,
      isLoading: false,
      isError,
      isClient: true,
    };
  }, [
    isLoggedIn,
    isClient,
    isLoading,
    isError,
    electionsData,
    activeContractData,
  ]);

  return result;
}
