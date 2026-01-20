import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import {
  useGetMyContractQuery,
  useGetExecutiveSummaryQuery,
  useGetDelegateActivityQuery,
} from "../../store/reports/clientReportEndpoints";

const getElectionId = () => {
  return String(window.localStorage.getItem("selectedElectionId") || "");
};

const ParticipacionPersonal: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  const electionId = getElectionId();

  // 1) validar contrato (backend ya restringe por territorio)
  const {
    data: contractResp,
    isLoading: contractLoading,
    isError: contractError,
  } = useGetMyContractQuery({ electionId }, { skip: !electionId });

  // 2) resumen ejecutivo
  const {
    data: summaryResp,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useGetExecutiveSummaryQuery(
    { electionId },
    { skip: !electionId || !contractResp?.hasContract },
  );

  // 3) actividad por mesa
  const {
    data: tablesResp,
    isLoading: tablesLoading,
    isError: tablesError,
  } = useGetDelegateActivityQuery(
    { electionId, groupBy: "table" },
    { skip: !electionId || !contractResp?.hasContract },
  );

  const loading = contractLoading || summaryLoading || tablesLoading;

  const tables = useMemo(() => {
    const arr = tablesResp?.data ?? [];
    // Orden por más actividad (si backend ya ordena, igual no estorba)
    return [...arr].sort(
      (a: any, b: any) =>
        (b.totalAttestations || 0) - (a.totalAttestations || 0),
    );
  }, [tablesResp?.data]);

  // Faltan vs con actividad: usando resumen ejecutivo
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

  if (!electionId) {
    return (
      <div className="p-10 text-center text-slate-600">
        No hay elección seleccionada. Selecciona una elección para ver el
        reporte.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        Cargando reporte de participación...
      </div>
    );
  }

  if (contractError || summaryError || tablesError) {
    return (
      <div className="p-10 text-center text-rose-700">
        Ocurrió un error cargando el reporte. Verifica tu sesión y el
        electionId.
      </div>
    );
  }

  if (!contractResp?.hasContract) {
    return (
      <div className="p-10 text-center text-slate-600">
        No tiene un contrato activo para esta elección.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Participación de Personal
        </h1>

        {/* Card de Resumen */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 mb-8">
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
            Tasa de participación:{" "}
            <span className="font-semibold">{resumenUI.tasa}</span>
          </div>

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
                        {/* Esto solo funcionará cuando tu backend agregue ballotIds/ballotsCount */}
                        {row.ballotsCount > 0 ? (
                          <Link
                            data-cy="view-ballots-link"
                            to={`/control-personal/mesa/${row.tableCode}/actas`}
                            state={{
                              ballotIds: row.ballotIds,
                              location: row.location,
                              tableCode: row.tableCode,
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-md border border-blue-100"
                          >
                            <FileText size={16} /> Ver Actas ({row.ballotsCount}
                            )
                          </Link>
                        ) : (
                          <span className="text-slate-300 italic font-light">
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {tables.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No hay registros para esta elección/contrato.
                      </td>
                    </tr>
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
