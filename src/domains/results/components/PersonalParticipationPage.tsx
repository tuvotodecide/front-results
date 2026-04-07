"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  UserX,
  FileX,
  LogIn,
  RefreshCw,
} from "lucide-react";
import {
  useGetMyContractQuery,
  useGetExecutiveSummaryQuery,
  useGetDelegateActivityQuery,
  type DelegateActivityByDelegateRow,
  type DelegateActivityByTableRow,
  type DelegateAttestationDetail,
} from "@/store/reports/clientReportEndpoints";
import { useMyContract } from "@/hooks/useMyContract";
import useElectionConfig from "@/hooks/useElectionConfig";
import useElectionId from "@/hooks/useElectionId";
import { buildResultsTableLink } from "@/utils/resultsTableLink";
import BrowserNavLink from "@/shared/routing/BrowserNavLink";
import { useBrowserLocation } from "@/shared/routing/browserLocation";
import { buildLoginHref } from "@/domains/auth/lib/access";

interface StatusMessageProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "warning" | "error" | "info";
}

const StatusMessage = ({
  icon,
  title,
  description,
  action,
  variant = "info",
}: Readonly<StatusMessageProps>) => {
  const variantStyles = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-slate-50 border-slate-200 text-slate-700",
  };

  const iconBg = {
    warning: "bg-amber-100",
    error: "bg-red-100",
    info: "bg-slate-100",
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-xl border-2 p-8 text-center ${variantStyles[variant]}`}
      >
        <div
          className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${iconBg[variant]}`}
        >
          {icon}
        </div>
        <h2 className="mb-2 text-xl font-bold">{title}</h2>
        <p className="mb-6 text-sm opacity-80">{description}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-lg border border-current bg-white px-6 py-3 font-semibold transition-all hover:bg-opacity-50"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

const isTableActivityRow = (row: unknown): row is DelegateActivityByTableRow =>
  typeof row === "object" && row !== null && "tableCode" in row;

const isDelegateActivityRow = (row: unknown): row is DelegateActivityByDelegateRow =>
  typeof row === "object" && row !== null && "dni" in row;

export default function PersonalParticipationPage() {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const { pathname, search } = useBrowserLocation();

  const {
    status: contractStatus,
    contract,
    isLoading: contractCheckLoading,
    isError: contractCheckError,
  } = useMyContract();

  const electionId = useElectionId();
  const { election } = useElectionConfig();

  const effectiveElectionId =
    contractStatus === "has_active" && contract?.electionId
      ? contract.electionId
      : electionId;

  const shouldLoadData =
    contractStatus === "has_active" && !!effectiveElectionId;

  const {
    data: contractResp,
    isLoading: contractLoading,
    isError: contractError,
  } = useGetMyContractQuery(
    { electionId: effectiveElectionId || "" },
    { skip: !shouldLoadData },
  );

  const {
    data: summaryResp,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useGetExecutiveSummaryQuery(
    { electionId: effectiveElectionId || "" },
    { skip: !shouldLoadData },
  );

  const {
    data: tablesResp,
    isLoading: tablesLoading,
    isError: tablesError,
  } = useGetDelegateActivityQuery(
    { electionId: effectiveElectionId || "", groupBy: "table" },
    { skip: !shouldLoadData },
  );

  const { data: delegatesResp, isLoading: delegatesLoading } =
    useGetDelegateActivityQuery(
      { electionId: effectiveElectionId || "", groupBy: "delegate" },
      { skip: !shouldLoadData },
    );

  const loading =
    contractCheckLoading ||
    contractLoading ||
    (shouldLoadData && !summaryResp && !summaryError);

  const attestationRows = useMemo(() => {
    const rows: Array<{
      delegateDni: string;
      delegateName: string;
      location: string;
      tableNumber: string | number | null;
      tableCode: string;
      ballotId: string | undefined;
      support: boolean | undefined;
      attestedAt: string | undefined;
    }> = [];

    (tablesResp?.data ?? []).filter(isTableActivityRow).forEach((table) => {
      (table.attestationDetails ?? []).forEach((att: DelegateAttestationDetail) => {
        const extractedTableNumber = table.tableCode
          ? table.tableCode.slice(-2).replace(/^0+/, "") || "1"
          : null;

        rows.push({
          delegateDni: att.dni || "Sin CI",
          delegateName: att.delegateName || "Sin nombre",
          location: table.location || "Sin ubicación",
          tableNumber: table.tableNumber || extractedTableNumber,
          tableCode: table.tableCode,
          ballotId: att.ballotId || table.ballotId,
          support: att.support,
          attestedAt: att.attestedAt,
        });
      });
    });

    return rows;
  }, [tablesResp?.data]);

  const resumenUI = useMemo(() => {
    const total = summaryResp?.summary?.totalDelegatesAuthorized ?? 0;
    const activos = summaryResp?.summary?.activeDelegates ?? 0;
    return {
      participaron: activos,
      faltantes: Math.max(total - activos, 0),
      total,
      tasa: summaryResp?.summary?.participationRate ?? "0%",
    };
  }, [summaryResp]);

  const delegadosSinVotar = useMemo(() => {
    if (!delegatesResp?.data) return [];
    return delegatesResp.data
      .filter(isDelegateActivityRow)
      .filter((d) => d.totalAttestations === 0);
  }, [delegatesResp?.data]);

  const territoryName = contract?.territory
    ? contract.territory.type === "municipality"
      ? contract.territory.municipalityName
      : contract.territory.departmentName
    : null;
  const resultsContext = useMemo(() => {
    const params = new URLSearchParams(search);
    return {
      electionId: effectiveElectionId,
      electionType: election?.type,
      departmentId: params.get("department"),
      provinceId: params.get("province"),
      municipalityId: params.get("municipality"),
      electoralSeatId: params.get("electoralSeat"),
      electoralLocationId: params.get("electoralLocation"),
    };
  }, [effectiveElectionId, election?.type, search]);

  if (contractCheckLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-slate-600">Verificando tu contrato...</p>
        </div>
      </div>
    );
  }

  if (contractStatus === "no_auth") {
    return (
      <StatusMessage
        icon={<LogIn size={32} className="text-slate-600" />}
        title="Inicia sesión para continuar"
        description="Necesitas iniciar sesión con tu cuenta de Alcalde o Gobernador para ver el reporte de participación de tu personal."
        action={{
          label: "Ir a Iniciar Sesión",
          onClick: () => {
            const loginHref = buildLoginHref(`${pathname}${search}`);
            router.push(loginHref);
          },
        }}
        variant="info"
      />
    );
  }

  if (contractStatus === "not_client") {
    return (
      <StatusMessage
        icon={<UserX size={32} className="text-amber-600" />}
        title="Acceso restringido"
        description="Esta sección es exclusiva para Alcaldes y Gobernadores con contratos activos. Tu cuenta no tiene permisos para acceder a estos reportes."
        variant="warning"
      />
    );
  }

  if (contractStatus === "no_contracts") {
    return (
      <StatusMessage
        icon={<FileX size={32} className="text-amber-600" />}
        title="Sin contratos asignados"
        description="No tienes ningún contrato asignado en el sistema. Contacta al administrador para que te asigne un contrato de cobertura electoral."
        variant="warning"
      />
    );
  }

  if (contractStatus === "all_inactive") {
    return (
      <StatusMessage
        icon={<AlertTriangle size={32} className="text-amber-600" />}
        title="Contratos inactivos"
        description="Tienes contratos registrados pero ninguno está activo actualmente. Contacta al administrador si crees que esto es un error."
        variant="warning"
      />
    );
  }

  if (contractCheckError) {
    return (
      <StatusMessage
        icon={<AlertTriangle size={32} className="text-red-600" />}
        title="Error de conexión"
        description="No pudimos verificar tu contrato. Por favor verifica tu conexión a internet e intenta nuevamente."
        action={{
          label: "Reintentar",
          onClick: () => window.location.reload(),
        }}
        variant="error"
      />
    );
  }

  if (!effectiveElectionId) {
    return (
      <StatusMessage
        icon={<AlertTriangle size={32} className="text-amber-600" />}
        title="Sin elección seleccionada"
        description="No hay una elección activa o seleccionada. Por favor selecciona una elección en el menú superior."
        variant="warning"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-[#459151]" />
          <p className="text-slate-600">Cargando reporte de participación...</p>
          {territoryName && (
            <p className="mt-2 text-sm text-slate-400">
              Territorio: {territoryName}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (contractError) {
    return (
      <StatusMessage
        icon={<AlertTriangle size={32} className="text-red-600" />}
        title="Error al cargar el reporte"
        description="Ocurrió un error cargando los datos del reporte. Esto puede ser un problema temporal con el servidor."
        action={{
          label: "Reintentar",
          onClick: () => window.location.reload(),
        }}
        variant="error"
      />
    );
  }

  if (!contractResp?.hasContract) {
    return (
      <StatusMessage
        icon={<FileX size={32} className="text-amber-600" />}
        title="Contrato no encontrado"
        description="No se encontró un contrato activo para la elección actual. Puede que tu contrato sea para otra elección."
        variant="warning"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Participación de Personal
          </h1>
          {territoryName && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-700">
              <span className="text-sm font-medium">
                {contract?.role === "MAYOR" ? "Alcaldía" : "Gobernación"} de{" "}
                {territoryName}
              </span>
            </div>
          )}
        </div>

        <div
          data-cy="summary-card"
          className="mb-8 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-md"
        >
          {summaryLoading ? (
            <div data-cy="summary-loading" className="text-center text-slate-500">
              <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-slate-400" />
              <p className="text-sm">Cargando resumen ejecutivo...</p>
            </div>
          ) : summaryError ? (
            <div className="text-center text-sm text-amber-600">
              No se pudo cargar el resumen ejecutivo. Intenta recargar.
            </div>
          ) : (
            <div data-cy="summary-loaded">
              <h2 className="text-xl leading-relaxed text-gray-700 md:text-2xl">
                De las personas autorizadas y designadas como delegados participaron
                <span className="mx-2 inline-block rounded-full bg-green-100 px-4 py-1 font-bold text-green-700">
                  {resumenUI.participaron}
                </span>
                y
                <span className="mx-2 inline-block rounded-full bg-red-100 px-4 py-1 font-bold text-red-700">
                  {resumenUI.faltantes}
                </span>
                no.
              </h2>

              <div className="mt-3 text-sm text-slate-500">
                Tasa de participacion:{" "}
                <span className="font-semibold">{resumenUI.tasa}</span>
                {resumenUI.total > 0 && (
                  <span className="ml-2">
                    (de {resumenUI.total} delegados autorizados)
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            data-cy="toggle-table-btn"
            onClick={() => setShowDetails(!showDetails)}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#459151] px-8 py-3 font-bold text-white shadow-lg shadow-slate-200 transition-all hover:opacity-90 active:scale-95"
          >
            {showDetails ? (
              <>
                Ocultar reporte por mesa <ChevronUp size={20} />
              </>
            ) : (
              <>
                Ver reporte por mesa <ChevronDown size={20} />
              </>
            )}
          </button>
        </div>

        {showDetails && (
          <div className="animate-fadeIn space-y-8">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
              <div className="border-b border-green-100 bg-green-50 px-6 py-4">
                <h3 className="text-lg font-bold text-green-800">
                  Delegados que participaron ({attestationRows.length} registros)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table
                  data-cy="participation-table"
                  className="w-full border-separate border-spacing-0 text-left"
                >
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-slate-100 px-4 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        CI
                      </th>
                      <th className="border-b border-slate-100 px-4 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Delegado
                      </th>
                      <th className="border-b border-slate-100 px-4 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Recinto
                      </th>
                      <th className="border-b border-slate-100 px-4 py-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nro. Mesa
                      </th>
                      <th className="border-b border-slate-100 px-4 py-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                        Acta
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {tablesLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                          Cargando reporte por mesa...
                        </td>
                      </tr>
                    ) : tablesError ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-amber-600">
                          No se pudo cargar el reporte por mesa. Intenta recargar.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {attestationRows.map((row, idx) => (
                          <tr
                            key={`${row.tableCode}-${row.delegateDni}-${idx}`}
                            className="group transition-colors hover:bg-slate-50/80"
                          >
                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-slate-700">
                                {row.delegateDni}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-slate-600">
                                {row.delegateName}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-slate-600">
                                {row.location}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-block rounded-md bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                                #{row.tableNumber || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-sm">
                              {row.ballotId ? (
                                <BrowserNavLink
                                  data-cy="view-ballots-link"
                                  href={buildResultsTableLink(
                                    row.tableCode,
                                    resultsContext,
                                  )}
                                  className="group-hover:shadow-md inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
                                >
                                  <FileText size={16} /> Ver Acta
                                </BrowserNavLink>
                              ) : (
                                <span className="font-light italic text-slate-300">
                                  Sin acta
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {attestationRows.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                              No hay registros de actividad para esta elección.
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!delegatesLoading && delegadosSinVotar.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-red-200 bg-white shadow-xl">
                <div className="border-b border-red-100 bg-red-50 px-6 py-4">
                  <h3 className="text-lg font-bold text-red-800">
                    Delegados que NO participaron ({delegadosSinVotar.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0 text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border-b border-slate-100 px-4 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                          CI
                        </th>
                        <th className="border-b border-slate-100 px-4 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Nombre
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {delegadosSinVotar.map((d) => (
                        <tr key={d.dni} className="transition-colors hover:bg-red-50/50">
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-slate-700">
                              {d.dni}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-600">
                              {d.name || "Sin nombre"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
