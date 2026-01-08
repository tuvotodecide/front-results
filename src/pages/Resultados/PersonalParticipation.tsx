import React, { useState } from "react";
import Breadcrumb2 from "../../components/Breadcrumb2";
import { useGetParticipacionPersonalQuery } from "../../store/personal/personalEndpoints";
import { useSelector } from "react-redux";
import { selectFilters } from "../../store/resultados/resultadosSlice";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  XCircle,
} from "lucide-react";

const ParticipacionPersonal: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const filters = useSelector(selectFilters);
  const { data, isLoading } = useGetParticipacionPersonalQuery(filters);

  if (isLoading)
    return (
      <div className="p-10 text-center">Cargando control de personal...</div>
    );

  const { summary, details } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Participación de Personal
        </h1>

        {/* Reutilizamos tu componente de filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8 border border-gray-200">
          <Breadcrumb2 />
        </div>

        {/* Card de Resumen (UI UX solicitada) */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 mb-8">
          <h2 className="text-xl md:text-2xl text-gray-700 leading-relaxed">
            De las personas que usted contrató participaron
            <span className="mx-2 inline-block px-4 py-1 bg-green-100 text-green-700 font-bold rounded-full">
              {summary.participaron}
            </span>
            y
            <span className="mx-2 inline-block px-4 py-1 bg-red-100 text-red-700 font-bold rounded-full">
              {summary.faltantes}
            </span>
            no.
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
                      Usuario Asignado
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Estado del Reporte
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {details.map((row: any) => (
                    <tr
                      key={row._id}
                      className="hover:bg-slate-50/80 transition-colors group"
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
                        <span className="text-sm text-slate-600">
                          {row.usuario || "Sin asignar"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.estado === "Recibida" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold ring-1 ring-emerald-600/20">
                            <CheckCircle2 size={14} /> Recibida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold ring-1 ring-rose-600/20 animate-pulse">
                            <XCircle size={14} /> Faltante
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {row.ballotId ? (
                          <Link
                            to={`/resultados/imagen/${row.ballotId}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-md border border-blue-100"
                          >
                            <FileText size={16} /> Ver Acta
                          </Link>
                        ) : (
                          <span className="text-slate-300 italic font-light">
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
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
