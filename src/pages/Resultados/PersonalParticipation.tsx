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

  // 2) Resumen ejecutivo — en paralelo con my-contract (no esperamos hasContract)
  const {
    data: summaryResp,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useGetExecutiveSummaryQuery(
    { electionId: effectiveElectionId || "" },
    { skip: !shouldLoadData }
  );

  // 3) Actividad por mesa — en paralelo con my-contract
  const {
    data: tablesResp,
    isLoading: tablesLoading,
    isError: tablesError,
  } = useGetDelegateActivityQuery(
    { electionId: effectiveElectionId || "", groupBy: "table" },
    { skip: !shouldLoadData }
  );

  // 4) Actividad por delegado — para ver quiénes NO han votado
  const {
    data: delegatesResp,
    isLoading: delegatesLoading,
  } = useGetDelegateActivityQuery(
    { electionId: effectiveElectionId || "", groupBy: "delegate" },
    { skip: !shouldLoadData }
  );

  // Esperar a que el contrato y el resumen carguen antes de mostrar la vista
  const loading =
    contractCheckLoading ||
    contractLoading ||
    (shouldLoadData && !summaryResp && !summaryError);

  // Aplanar attestationDetails de todas las mesas en filas individuales
  const attestationRows = useMemo(() => {
    const rows: any[] = [];
    (tablesResp?.data ?? []).forEach((table: any) => {
      (table.attestationDetails ?? []).forEach((att: any) => {
        // Extraer número de mesa del tableCode (últimos 2 dígitos)
        const extractedTableNumber = table.tableCode
          ? table.tableCode.slice(-2).replace(/^0+/, '') || '1'
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

  // Delegados que NO han votado
  const delegadosSinVotar = useMemo(() => {
    if (!delegatesResp?.data) return [];
    return delegatesResp.data.filter((d: any) => d.totalAttestations === 0);
  }, [delegatesResp?.data]);

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
        <div data-cy="summary-card" className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 mb-8">
          {summaryLoading ? (
            <div data-cy="summary-loading" className="text-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3 text-slate-400" />
              <p className="text-sm">Cargando resumen ejecutivo...</p>
            </div>
          ) : summaryError ? (
            <div className="text-center text-amber-600 text-sm">
              No se pudo cargar el resumen ejecutivo. Intenta recargar.
            </div>
          ) : (
            <div data-cy="summary-loaded">
              <h2 className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                De las personas autorizadas  y designadas como delegados participaron
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
            </div>
          )}

          <button
            data-cy="toggle-table-btn"
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
          <div className="space-y-8 animate-fadeIn">
            {/* Delegados que SÍ votaron */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <h3 className="text-lg font-bold text-green-800">
                  Delegados que participaron ({attestationRows.length} registros)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table
                  data-cy="participation-table"
                  className="w-full text-left border-separate border-spacing-0"
                >
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        CI
                      </th>
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Delegado
                      </th>
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Recinto
                      </th>
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                        Nro. Mesa
                      </th>
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                        Acta
                      </th>
                    </tr>
                  </thead>

                <tbody className="divide-y divide-slate-50">
                  {tablesLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        Cargando reporte por mesa...
                      </td>
                    </tr>
                  ) : tablesError ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-amber-600"
                      >
                        No se pudo cargar el reporte por mesa. Intenta recargar.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {attestationRows.map((row: any, idx: number) => (
                        <tr
                          key={`${row.tableCode}-${row.delegateDni}-${idx}`}
                          className="hover:bg-slate-50/80 transition-colors group"
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
                            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-sm font-bold rounded-md">
                              #{row.tableNumber || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-center text-sm">
                            {row.ballotId ? (
                              <Link
                                data-cy="view-ballots-link"
                                to={`/resultados/mesa/${row.tableCode}`}
                                state={{
                                  ballotId: row.ballotId,
                                  location: row.location,
                                  tableCode: row.tableCode,
                                  tableNumber: row.tableNumber,
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-md border border-blue-100"
                              >
                                <FileText size={16} /> Ver Acta
                              </Link>
                            ) : (
                              <span className="text-slate-300 italic font-light">
                                Sin acta
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {attestationRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
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

          {/* Delegados que NO han votado */}
          {!delegatesLoading && delegadosSinVotar.length > 0 && (
            <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-red-200">
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <h3 className="text-lg font-bold text-red-800">
                  Delegados que NO participaron ({delegadosSinVotar.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        CI
                      </th>
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Nombre
                      </th>
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Teléfono
                      </th>
                      <th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {delegadosSinVotar.map((d: any) => (
                      <tr key={d.dni} className="hover:bg-red-50/50 transition-colors">
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
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600">
                            {d.phone || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600">
                            {d.email || "—"}
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
};

export default ParticipacionPersonal;
