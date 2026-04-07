"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import BrowserNavLink from "@/shared/routing/BrowserNavLink";
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

const resolveElectionTypeLabel = (electionType?: string) => {
  if (electionType === "municipal") {
    return "Municipal";
  }

  if (electionType === "departamental") {
    return "Departamental";
  }

  return "Presidencial";
};

const resolveImageSrc = () => {
  if (typeof tuvotoDecideImage === "string") {
    return tuvotoDecideImage;
  }

  return (tuvotoDecideImage as { src: string }).src;
};

export default function ResultsAccessHomePage() {
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

  const isLoadingContracts = isLoggedIn && isClient ? myContractsLoading : false;
  const tableTitle = isLoggedIn && isClient
    ? "Mis Contratos Activos"
    : "Resultados";
  const appImageSrc = resolveImageSrc();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br bg-[#459151] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Tu voto decide
            </h1>
            <p className="mt-3 text-lg text-blue-100 sm:text-xl">
              Plataforma para el control electoral
            </p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-blue-200 sm:text-base">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoadingContracts && (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isLoadingContracts && contractRows.length > 0 && (
            <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tableTitle}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona un territorio disponible para ver resultados.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Elección
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Alcance
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {contractRows.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                          {item.electionName}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                          {resolveElectionTypeLabel(item.electionType)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                          {item.territoryLabel}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <BrowserNavLink
                            href={buildGeneralResultsLink({
                              electionId: item.electionId,
                              electionType: item.electionType,
                              departmentId: item.departmentId,
                              municipalityId: item.municipalityId,
                            })}
                            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                          >
                            Ver resultados
                          </BrowserNavLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoadingContracts && contractRows.length === 0 && (
            <div className="rounded-xl border border-gray-300 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto max-w-md">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-8 w-8 text-gray-400"
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
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r bg-[#459151] shadow-xl">
            <div className="px-8 py-12 sm:px-12 sm:py-16">
              <div className="text-center">
                <h2 className="mb-4 text-3xl font-bold text-white">
                  Lleva el control en tu móvil
                </h2>

                <p className="mx-auto mb-8 max-w-2xl text-xl text-green-100">
                  Participa en el control electoral y revisa los resultados.
                </p>

                <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                  <div className="shrink-0">
                    <img
                      src={appImageSrc}
                      alt="Tu Voto Decide App"
                      className="h-auto w-32 rounded-xl shadow-lg ring-4 ring-white ring-opacity-20"
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center text-blue-100 sm:justify-start">
                        <svg
                          className="mr-2 h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Identidad Digital Soberana</span>
                      </div>
                      <div className="flex items-center justify-center text-blue-100 sm:justify-start">
                        <svg
                          className="mr-2 h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Conversión de Actas en NFTs</span>
                      </div>
                      <div className="flex items-center justify-center text-blue-100 sm:justify-start">
                        <svg
                          className="mr-2 h-5 w-5"
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
                      className="mt-6 inline-flex items-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl"
                    >
                      <svg
                        className="mr-3 h-6 w-6"
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

      <div className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="mb-4 text-lg font-medium text-gray-700">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Para más información, visite:</p>
              <a
                href="https://asoblockchainbolivia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline transition-colors duration-200 hover:text-blue-800"
              >
                https://asoblockchainbolivia.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
