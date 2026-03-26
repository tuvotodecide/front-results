import React from "react";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";

interface ScheduleSummaryCardProps {
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsPublishAt?: string | null;
  title?: string;
  compact?: boolean;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "No definida";

  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ScheduleSummaryCard: React.FC<ScheduleSummaryCardProps> = ({
  votingStart,
  votingEnd,
  resultsPublishAt,
  title = "Horario de votación",
  compact = false,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF7F0] text-[#459151]">
          <CalendarDaysIcon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Revisa las fechas de apertura, cierre y publicación de resultados.
          </p>
        </div>
      </div>

      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Apertura
          </p>
          <p className="mt-1 text-sm font-medium text-gray-800">{formatDateTime(votingStart)}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Cierre
          </p>
          <p className="mt-1 text-sm font-medium text-gray-800">{formatDateTime(votingEnd)}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-gray-500">
            <ClockIcon className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Resultados
            </p>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-800">
            {formatDateTime(resultsPublishAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSummaryCard;
