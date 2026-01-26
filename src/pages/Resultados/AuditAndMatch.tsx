import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  XCircle,
} from "lucide-react";

import Breadcrumb2 from "../../components/Breadcrumb2";
import { useGetAuditoriaTSEQuery } from "../../store/personal/personalEndpoints";
import { selectFilters } from "../../store/resultados/resultadosSlice";
import { useGetConfigurationStatusQuery } from "../../store/configurations/configurationsEndpoints";
import useElectionId from "../../hooks/useElectionId";

const AuditAndMatch: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const filters = useSelector(selectFilters);
  const electionId = useElectionId();
  const { isLoading: isConfigLoading } = useGetConfigurationStatusQuery();
  const { data, isLoading } = useGetAuditoriaTSEQuery(
    { ...filters, electionId: electionId || "" },
    { skip: !electionId },
  );
  const details = data?.details ?? [];

  const summary = useMemo(() => {
    const observadasCalc = details.filter(
      (r: any) => r.auditoria === "No coincide" || r.auditoria === "Anulada",
    ).length;

    const observadas =
      typeof data?.observados === "number" ? data.observados : observadasCalc;
    const sinObs = Math.max(details.length - observadas, 0);

    return { observadas, sinObs, total: details.length };
  }, [data?.observados, details]);
  if (isConfigLoading) {
    return (
      <div className="p-10 text-center">
        Verificando configuración del sistema...
      </div>
    );
  }

  // 2. No hay elección activa
  if (!electionId) {
    return (
      <div className="p-10 text-center text-slate-600">
        No hay elección seleccionada o activa en este momento.
      </div>
    );
  }

  // 3. Cargando datos de la auditoría
  if (isLoading) {
    return <div className="p-10 text-center">Cargando auditoría vs TSE...</div>;
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Auditoría vs Resultados TSE
        </h1>

        {/* Reutilizamos tu componente de filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8 border border-gray-200">
          <Breadcrumb2 />
        </div>

        {/* Card de Resumen (misma UI del otro) */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 mb-8">
          <h2 className="text-xl md:text-2xl text-gray-700 leading-relaxed">
            Del total de actas analizadas
            <span className="mx-2 inline-block px-4 py-1 bg-rose-100 text-rose-700 font-bold rounded-full">
              {summary.observadas}
            </span>
            están observadas y
            <span className="mx-2 inline-block px-4 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full">
              {summary.sinObs}
            </span>
            no presentan observaciones.
          </h2>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-10 inline-flex items-center gap-2 px-8 py-3 bg-[#459151] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            {showDetails ? (
              <>
                Ocultar reporte detallado <ChevronUp size={20} />
              </>
            ) : (
              <>
                Ver reporte detallado por mesa <ChevronDown size={20} />
              </>
            )}
          </button>
        </div>

        {/* Tabla Detallada Estilo Excel/Reporte */}
        {showDetails && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      Recinto
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Mesa
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      Atestiguada por
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Auditoría con TSE
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {details.map((row: any) => {
                    const isError = row.auditoria === "No coincide";
                    const isWarning = row.auditoria === "Anulada";
                    const isObserved = isError || isWarning;

                    return (
                      <tr
                        key={row._id}
                        className={[
                          "transition-colors group",
                          isObserved
                            ? "bg-rose-50 hover:bg-rose-100/80"
                            : "hover:bg-slate-50/80",
                        ].join(" ")}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-700">
                            {row.recinto}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                            {row.mesa}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white">
                              {row.testigo?.charAt(0) || "U"}
                            </div>
                            <span className="text-sm text-slate-600">
                              {row.testigo || "Sin asignar"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isError ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold ring-1 ring-rose-600/20">
                              <AlertTriangle size={14} /> No coincide
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold ring-1 ring-amber-600/20">
                              <XCircle size={14} /> Anulada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold ring-1 ring-emerald-600/20">
                              <CheckCircle2 size={14} /> Sin obs.
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center text-sm">
                          {row.ballotId ? (
                            <Link
                              to={`/resultados/imagen/${row.ballotId}`}
                              className={[
                                "inline-flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-all group-hover:shadow-md border",
                                isObserved
                                  ? "bg-rose-50 text-rose-500 hover:bg-rose-400 hover:text-white border-rose-200"
                                  : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100",
                              ].join(" ")}
                            >
                              <Eye size={16} />{" "}
                              {isObserved ? "Ver Actas" : "Ver Acta"}
                            </Link>
                          ) : (
                            <span className="text-slate-300 italic font-light">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {details.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No hay registros para los filtros seleccionados.
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

export default AuditAndMatch;
