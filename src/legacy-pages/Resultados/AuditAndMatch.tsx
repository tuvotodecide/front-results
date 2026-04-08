import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  LoaderCircle,
} from "lucide-react";

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
    const observadas = typeof data?.observados === "number" ? data.observados : 0;
    const sinObs =
      typeof data?.sinObservaciones === "number" ? data.sinObservaciones : 0;
    const pendientes = typeof data?.pendientes === "number" ? data.pendientes : 0;
    const total = typeof data?.total === "number" ? data.total : details.length;

    return { observadas, sinObs, pendientes, total };
  }, [data?.observados, data?.sinObservaciones, data?.pendientes, data?.total, details.length]);

  if (isConfigLoading) {
    return (
      <div className="p-10 text-center">
        Verificando configuración del sistema...
      </div>
    );
  }

  if (!electionId) {
    return (
      <div className="p-10 text-center text-slate-600">
        No hay elección seleccionada o activa en este momento.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-10 text-center">Cargando auditoría vs TSE...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Auditoría vs Resultados TSE
        </h1>


        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 mb-8">
          <h2 className="text-xl md:text-2xl text-gray-700 leading-relaxed">
            De todas las actas atestiguadas
            <span className="mx-2 inline-block px-4 py-1 bg-slate-100 text-slate-700 font-bold rounded-full">
              {summary.total}
            </span>
            se encontraron
            <span className="mx-2 inline-block px-4 py-1 bg-rose-100 text-rose-700 font-bold rounded-full">
              {summary.observadas}
            </span>
            observadas,
            <span className="mx-2 inline-block px-4 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full">
              {summary.sinObs}
            </span>
            sin observaciones y
            <span className="mx-2 inline-block px-4 py-1 bg-amber-100 text-amber-700 font-bold rounded-full">
              {summary.pendientes}
            </span>
            pendientes de comparación.
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
                Ver reporte detallado por acta <ChevronDown size={20} />
              </>
            )}
          </button>
        </div>

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
                    const isMismatch = row.auditoria === "No coincide";
                    const isPending = row.auditoria === "Pendiente";

                    return (
                      <tr
                        key={row._id}
                        className={[
                          "transition-colors group",
                          isMismatch
                            ? "bg-rose-50 hover:bg-rose-100/80"
                            : isPending
                              ? "bg-amber-50 hover:bg-amber-100/80"
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
                          {isMismatch ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold ring-1 ring-rose-600/20">
                              <AlertTriangle size={14} /> No coincide
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold ring-1 ring-amber-600/20">
                              <LoaderCircle size={14} /> Pendiente
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
                                isMismatch
                                  ? "bg-rose-50 text-rose-500 hover:bg-rose-400 hover:text-white border-rose-200"
                                  : isPending
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-400 hover:text-white border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-100",
                              ].join(" ")}
                            >
                              <Eye size={16} /> Ver Acta
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
