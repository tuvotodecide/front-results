import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "../../store/reports/clientReportEndpoints";
import { useMyContract } from "../../hooks/useMyContract";
import useElectionId from "../../hooks/useElectionId";

// Componente para mostrar mensajes de estado
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

const StatusMessage: React.FC<StatusMessageProps> = ({
  icon,
  title,
  description,
  action,
  variant = "info",
}) => {
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
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div
        className={`max-w-md w-full rounded-xl border-2 p-8 text-center ${variantStyles[variant]}`}
      >
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${iconBg[variant]} mb-4`}
        >
          {icon}
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm opacity-80 mb-6">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-current rounded-lg font-semibold hover:bg-opacity-50 transition-all"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

const ParticipacionPersonal: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  // Hook principal para estado del contrato
  const {
    status: contractStatus,
    contract,
    isLoading: contractCheckLoading,
    isError: contractCheckError,
  } = useMyContract();

  // Obtener electionId (del contrato si existe, o del selector)
  const electionId = useElectionId();

  // El electionId efectivo es el del contrato si tiene uno activo
  const effectiveElectionId =
    contractStatus === "has_active" && contract?.electionId
      ? contract.electionId
      : electionId;

  // Solo cargar datos si tiene contrato activo
  const shouldLoadData =
    contractStatus === "has_active" && !!effectiveElectionId;

  // 1) Validar contrato con electionId
  const {
    data: contractResp,
    isLoading: contractLoading,
    isError: contractError,
  } = useGetMyContractQuery(
    { electionId: effectiveElectionId || "" },
    { skip: !shouldLoadData }
  );

  // 2) Resumen ejecutivo
  const {
    data: summaryResp,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useGetExecutiveSummaryQuery(
    { electionId: effectiveElectionId || "" },
    { skip: !shouldLoadData || !contractResp?.hasContract }
  );

  // 3) Actividad por mesa
  const {
    data: tablesResp,
    isLoading: tablesLoading,
    isError: tablesError,
  } = useGetDelegateActivityQuery(
    { electionId: effectiveElectionId || "", groupBy: "table" },
    { skip: !shouldLoadData || !contractResp?.hasContract }
  );

  const loading = contractCheckLoading || contractLoading;

  const tables = useMemo(() => {
    const arr = tablesResp?.data ?? [];
    return [...arr].sort(
      (a: any, b: any) =>
        (b.totalAttestations || 0) - (a.totalAttestations || 0)
    );
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

  // Obtener nombre del territorio
  const territoryName = contract?.territory
    ? contract.territory.type === "municipality"
      ? contract.territory.municipalityName
      : contract.territory.departmentName
    : null;

  // ========== RENDERIZADO POR ESTADOS ==========

  // Estado: Cargando verificación inicial
  if (contractCheckLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Verificando tu contrato...</p>
        </div>
      </div>
    );
  }

  // Estado: No está logueado
  if (contractStatus === "no_auth") {
    return (
      <StatusMessage
        icon={<LogIn size={32} className="text-slate-600" />}
        title="Inicia sesión para continuar"
        description="Necesitas iniciar sesión con tu cuenta de Alcalde o Gobernador para ver el reporte de participación de tu personal."
        action={{
          label: "Ir a Iniciar Sesión",
          onClick: () => navigate("/login"),
        }}
        variant="info"
      />
    );
  }

  // Estado: Logueado pero no es cliente (MAYOR/GOVERNOR)
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

  // Estado: Es cliente pero no tiene ningún contrato
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

  // Estado: Tiene contratos pero todos inactivos
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

  // Estado: Error al verificar contrato
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

  // Estado: Sin electionId (no debería pasar si tiene contrato activo, pero por seguridad)
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

  // Estado: Cargando datos del reporte
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#459151] mx-auto mb-4" />
          <p className="text-slate-600">Cargando reporte de participación...</p>
          {territoryName && (
            <p className="text-sm text-slate-400 mt-2">
              Territorio: {territoryName}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Estado: Error cargando contrato
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

  // Estado: Contrato no válido para esta elección (caso borde)
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

  // ========== VISTA PRINCIPAL ==========
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header con info del territorio */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Participación de Personal
          </h1>
          {territoryName && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <span className="text-sm font-medium">
                {contract?.role === "MAYOR" ? "Alcaldía" : "Gobernación"} de{" "}
                {territoryName}
              </span>
            </div>
          )}
        </div>

        {/* Card de Resumen */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 mb-8">
          {summaryLoading ? (
            <div className="text-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3 text-slate-400" />
              <p className="text-sm">Cargando resumen ejecutivo...</p>
            </div>
          ) : summaryError ? (
            <div className="text-center text-amber-600 text-sm">
              No se pudo cargar el resumen ejecutivo. Intenta recargar.
            </div>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                De las personas autorizadas participaron
                <span className="mx-2 inline-block px-4 py-1 bg-green-100 text-green-700 font-bold rounded-full">
                  {resumenUI.participaron}
                </span>
                y
                <span className="mx-2 inline-block px-4 py-1 bg-red-100 text-red-700 font-bold rounded-full">
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
            </>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-10 inline-flex items-center gap-2 px-8 py-3 bg-[#459151] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-slate-200 active:scale-95"
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

        {/* Tabla por mesa */}
        {showDetails && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 animate-fadeIn">
            <div className="overflow-x-auto">
              <table
                data-cy="participation-table"
                className="w-full text-left border-separate border-spacing-0"
              >
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      Recinto
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Mesa
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Atestiguamientos
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Delegados activos
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {tablesLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        Cargando reporte por mesa...
                      </td>
                    </tr>
                  ) : tablesError ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-amber-600"
                      >
                        No se pudo cargar el reporte por mesa. Intenta recargar.
                      </td>
                    </tr>
                  ) : (
                    <>
                  {tables.map((row: any) => (
                    <tr
                      key={row.tableCode}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700">
                          {row.location || "Sin ubicación"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                          {row.tableCode}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {row.totalAttestations ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-slate-600">
                          {row.delegatesCount ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center text-sm">
                        {(() => {
                          const ballotsCount =
                            row.ballotsCount ??
                            row.ballotIds?.length ??
                            (row.ballotId ? 1 : 0);
                          const hasBallots =
                            (row.ballotsCount ?? 0) > 0 ||
                            (row.ballotIds?.length ?? 0) > 0 ||
                            !!row.ballotId;

                          return hasBallots ? (
                            <Link
                              data-cy="view-ballots-link"
                              to={`/resultados/mesa/${row.tableCode}`}
                              state={{
                                ballotIds: row.ballotIds,
                                location: row.location,
                                tableCode: row.tableCode,
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-md border border-blue-100"
                            >
                              <FileText size={16} /> Ver Actas ({ballotsCount})
                            </Link>
                          ) : (
                            <span className="text-slate-300 italic font-light">
                              Pendiente
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}

                  {tables.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-400"
                      >
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
        )}
      </div>
    </div>
  );
};

export default ParticipacionPersonal;
