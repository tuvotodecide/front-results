"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  LoaderCircle,
} from "lucide-react";
import BrowserNavLink from "@/shared/routing/BrowserNavLink";
import { useBrowserSearchParams } from "@/shared/routing/browserLocation";
import useElectionId from "@/hooks/useElectionId";
import { useGetConfigurationStatusQuery } from "@/store/configurations/configurationsEndpoints";
import { useGetAuditoriaTSEQuery } from "@/store/personal/personalEndpoints";
import { selectFilters } from "@/store/resultados/resultadosSlice";

export default function AuditAndMatchPage() {
  const [showDetails, setShowDetails] = useState(false);
  const filters = useSelector(selectFilters);
  const electionId = useElectionId();
  const searchParams = useBrowserSearchParams();
  const { isLoading: isConfigLoading } = useGetConfigurationStatusQuery();
  const { data, isLoading } = useGetAuditoriaTSEQuery(
    { ...filters, electionId: electionId || "" },
    { skip: !electionId },
  );

  const details = data?.details ?? [];
  const search = searchParams.toString();

  const summary = useMemo(() => {
    const observadas = typeof data?.observados === "number" ? data.observados : 0;
    const sinObs =
      typeof data?.sinObservaciones === "number" ? data.sinObservaciones : 0;
    const pendientes = typeof data?.pendientes === "number" ? data.pendientes : 0;
    const total = typeof data?.total === "number" ? data.total : details.length;

    return { observadas, sinObs, pendientes, total };
  }, [
    data?.observados,
    data?.sinObservaciones,
    data?.pendientes,
    data?.total,
    details.length,
  ]);

  if (isConfigLoading) {
    return (
      <div className="p-10 text-center">
        Verificando configuracion del sistema...
      </div>
    );
  }

  if (!electionId) {
    return (
      <div className="p-10 text-center text-slate-600">
        No hay eleccion seleccionada o activa en este momento.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-10 text-center">Cargando auditoria vs TSE...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Auditoria vs Resultados TSE
        </h1>

        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-md">
          <h2 className="text-xl leading-relaxed text-gray-700 md:text-2xl">
            De todas las actas atestiguadas
            <span className="mx-2 inline-block rounded-full bg-slate-100 px-4 py-1 font-bold text-slate-700">
              {summary.total}
            </span>
            se encontraron
            <span className="mx-2 inline-block rounded-full bg-rose-100 px-4 py-1 font-bold text-rose-700">
              {summary.observadas}
            </span>
            observadas,
            <span className="mx-2 inline-block rounded-full bg-emerald-100 px-4 py-1 font-bold text-emerald-700">
              {summary.sinObs}
            </span>
            sin observaciones y
            <span className="mx-2 inline-block rounded-full bg-amber-100 px-4 py-1 font-bold text-amber-700">
              {summary.pendientes}
            </span>
            pendientes de comparacion.
          </h2>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#459151] px-8 py-3 font-bold text-white shadow-lg shadow-slate-200 transition-all hover:opacity-90 active:scale-95"
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
          <div className="animate-fadeIn overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-slate-100 px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Recinto
                    </th>
                    <th className="border-b border-slate-100 px-6 py-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mesa
                    </th>
                    <th className="border-b border-slate-100 px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Atestiguada por
                    </th>
                    <th className="border-b border-slate-100 px-6 py-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Auditoria con TSE
                    </th>
                    <th className="border-b border-slate-100 px-6 py-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {details.map((row) => {
                    const isMismatch = row.auditoria === "No coincide";
                    const isPending = row.auditoria === "Pendiente";
                    const ballotHref = row.ballotId
                      ? search
                        ? `/resultados/imagen/${row.ballotId}?${search}`
                        : `/resultados/imagen/${row.ballotId}`
                      : null;

                    return (
                      <tr
                        key={row._id}
                        className={[
                          "group transition-colors",
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
                          <span className="inline-block rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {row.mesa}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white bg-slate-200 text-[10px] font-bold text-slate-600">
                              {row.testigo?.charAt(0) || "U"}
                            </div>
                            <span className="text-sm text-slate-600">
                              {row.testigo || "Sin asignar"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isMismatch ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-600/20">
                              <AlertTriangle size={14} /> No coincide
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20">
                              <LoaderCircle size={14} /> Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                              <CheckCircle2 size={14} /> Sin obs.
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center text-sm">
                          {ballotHref ? (
                            <BrowserNavLink
                              href={ballotHref}
                              className={[
                                "inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-bold transition-all group-hover:shadow-md",
                                isMismatch
                                  ? "border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-400 hover:text-white"
                                  : isPending
                                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-400 hover:text-white"
                                    : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white",
                              ].join(" ")}
                            >
                              <Eye size={16} /> Ver Acta
                            </BrowserNavLink>
                          ) : (
                            <span className="font-light italic text-slate-300">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {details.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
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
}
