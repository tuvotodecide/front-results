"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "@/domains/resultados/navigation/compat";
import { selectAuth, selectIsLoggedIn } from "@/store/auth/authSlice";
import {
  useGetMyElectionsQuery,
  useGetPublicActiveContractsQuery,
} from "@/store/contracts/contractsEndpoints";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";
import { buildGeneralResultsLink } from "@/utils/resultsGeneralLink";

type ContractRow = {
  id: string;
  electionId: string;
  electionName: string;
  electionType?: "municipal" | "departamental" | "presidential" | string;
  territoryType: "municipality" | "department";
  departmentId?: string;
  municipalityId?: string;
  territoryLabel: string;
};

const resolveTerritoryType = (territory: {
  type?: "municipality" | "department";
  municipalityId?: string;
  departmentId?: string;
}) => {
  if (territory.type === "municipality" || territory.municipalityId) {
    return "municipality" as const;
  }

  return "department" as const;
};

export default function ResultadosHomePage() {
  const appImage = tuvotoDecideImage as string | { src: string };
  const appImageSrc = typeof appImage === "string" ? appImage : appImage.src;
  const auth = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isClient =
    auth.user?.role === "MAYOR" || auth.user?.role === "GOVERNOR";

  const { data: publicContractsData } = useGetPublicActiveContractsQuery(
    undefined,
    {
      skip: isLoggedIn && isClient,
    },
  );

  const { data: myElectionsData, isLoading: myContractsLoading } =
    useGetMyElectionsQuery(undefined, {
      skip: !isLoggedIn || !isClient,
    });

  const contractRows = useMemo<ContractRow[]>(() => {
    if (isLoggedIn && isClient) {
      return (myElectionsData ?? []).flatMap((election) =>
        election.contracts
          .filter((contract) => contract.active)
          .map((contract) => {
            const territoryType = resolveTerritoryType(contract.territory);

            return {
              id: contract.contractId,
              electionId: election.electionId,
              electionName: election.electionName,
              electionType: election.electionType,
              territoryType,
              departmentId: contract.territory.departmentId,
              municipalityId: contract.territory.municipalityId,
              territoryLabel:
                territoryType === "municipality"
                  ? contract.territory.municipalityName || "Sin municipio"
                  : contract.territory.departmentName || "Sin departamento",
            };
          }),
      );
    }

    return (publicContractsData?.data ?? []).map((contract) => {
      const territoryType = resolveTerritoryType(contract.territory);

      return {
        id: contract.contractId,
        electionId: contract.election.electionId,
        electionName: contract.election.electionName,
        electionType: contract.election.electionType,
        territoryType,
        departmentId: contract.territory.departmentId,
        municipalityId: contract.territory.municipalityId,
        territoryLabel:
          territoryType === "municipality"
            ? contract.territory.municipalityName || "Sin municipio"
            : contract.territory.departmentName || "Sin departamento",
      };
    });
  }, [isLoggedIn, isClient, myElectionsData, publicContractsData?.data]);

  const isLoadingContracts =
    isLoggedIn && isClient ? myContractsLoading : false;

  const tableTitle = isLoggedIn && isClient
    ? "Mis Contratos Activos"
    : "Resultados";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br bg-[#459151] text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Tu voto decide
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-blue-100">
              Plataforma para el control electoral
            </p>
            <p className="mt-2 text-sm sm:text-base font-medium text-blue-200 uppercase tracking-wide">
              Elecciones Subnacionales Bolivia 2026
            </p>
            {isLoggedIn && auth.user && (
              <p className="mt-2 text-sm text-green-200">
                {auth.user.role === "MAYOR" && auth.user.municipalityName && (
                  <>Usuario vinculado a: {auth.user.municipalityName}</>
                )}
                {auth.user.role === "GOVERNOR" && auth.user.departmentName && (
                  <>Usuario vinculado a: {auth.user.departmentName}</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoadingContracts && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isLoadingContracts && contractRows.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tableTitle}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selecciona un territorio disponible para ver resultados.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Elección
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Alcance
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {contractRows.map((item) => {
                      const typeLabel =
                        item.electionType === "municipal"
                          ? "Municipal"
                          : item.electionType === "departamental"
                            ? "Departamental"
                            : "Presidencial";

                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 text-sm text-gray-700 text-center">
                            {item.electionName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-center">
                            {typeLabel}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-center">
                            {item.territoryLabel}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              to={buildGeneralResultsLink({
                                electionId: item.electionId,
                                electionType: item.electionType,
                                departmentId: item.departmentId,
                                municipalityId: item.municipalityId,
                              })}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Ver resultados
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoadingContracts && contractRows.length === 0 && (
            <div className="bg-white border border-gray-300 rounded-xl p-8 text-center shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sin contratos disponibles
                </h3>
                <p className="text-gray-600">
                  No hay contratos activos para mostrar en este momento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r bg-[#459151] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-8 py-12 sm:px-12 sm:py-16">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Lleva el control en tu móvil
                </h2>

                <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                  Participa en el control electoral y revisa los resultados.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={appImageSrc}
                      alt="Tu Voto Decide App"
                      className="w-32 h-auto rounded-xl shadow-lg ring-4 ring-white ring-opacity-20"
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Identidad Digital Soberana</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Conversión de hojas de trabajo en NFTs</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Validación Blockchain</span>
                      </div>
                    </div>

                    <a
                      href="https://play.google.com/store/apps/details?id=com.tuvotodecide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg
                        className="w-6 h-6 mr-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                      Descargar en Google Play
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
