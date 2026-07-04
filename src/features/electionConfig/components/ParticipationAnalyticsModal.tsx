import React, { useRef, useState } from "react";
import Modal2 from "../../../components/Modal2";
import {
  useDownloadParticipationReportWithScreenshotMutation,
  useGetParticipationAnalyticsQuery,
} from "../../../store/votingEvents";
import type { ParticipationAnalyticsStatus } from "../../../store/votingEvents/types";
import { getRequestErrorMessage } from "../requestErrorMessage";
import { formatDateTimeForUi } from "../renderUtils";
import { captureElementAsPng } from "../captureElementAsPng";

const STATUS_LABELS: Record<ParticipationAnalyticsStatus, string> = {
  IN_PROGRESS: "En proceso",
  FINISHED: "Finalizada",
  RESULTS_PUBLISHED: "Resultados publicados",
  RESULTS_NOT_PUBLISHED: "Resultados no publicados",
};

type ParticipationAnalyticsModalProps = {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
  canDownloadReport?: boolean;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-BO").format(Number.isFinite(value) ? value : 0);

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const CARD_STYLES = {
  enabled: {
    text: "text-[#1F5BE3]",
    highlight: "bg-[#EDF3FF]",
  },
  participated: {
    text: "text-[#2E7D32]",
    highlight: "bg-[#EAF5EC]",
  },
  pending: {
    text: "text-[#C75A00]",
    highlight: "bg-[#FFF4E4]",
  },
} as const;

const StatCard: React.FC<{
  label: string;
  value: number;
  tone: keyof typeof CARD_STYLES;
}> = ({ label, value, tone }) => (
  <div className="min-h-[102px] rounded-lg border border-[#DDDDDD] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <p className="text-base font-medium text-[#7A7A7A]">{label}</p>
    <p
      className={`mt-2 inline-block px-0.5 text-[28px] font-bold leading-none ${CARD_STYLES[tone].text} ${CARD_STYLES[tone].highlight}`}
    >
      {formatNumber(value)}
    </p>
  </div>
);

const ParticipationAnalyticsModal: React.FC<ParticipationAnalyticsModalProps> = ({
  isOpen,
  eventId,
  onClose,
  canDownloadReport = true,
}) => {
  const captureRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [downloadParticipationReport, { isLoading: isDownloading }] =
    useDownloadParticipationReportWithScreenshotMutation();
  const {
    data,
    isFetching,
    isError,
    error,
  } = useGetParticipationAnalyticsQuery(eventId, {
    skip: !isOpen || !eventId,
  });

  const percentage = Number(data?.participationPercentage ?? 0);
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  const participationLabel = `${percentage}%`;
  const statusLabel = data?.status ? STATUS_LABELS[data.status] : "Sin estado";
  const pendingLabel = data?.status === "IN_PROGRESS" ? "Pendientes" : "No participaron";
  const hasNoEnabledVoters = Boolean(data && data.totalEnabled === 0);
  const isReportBusy = isCapturing || isDownloading;

  const handleDownload = async () => {
    if (!eventId || !data || isReportBusy || downloadInFlightRef.current) return;
    if (!captureRef.current) {
      setDownloadError("No se pudo capturar el modal de analíticas.");
      return;
    }

    try {
      downloadInFlightRef.current = true;
      setDownloadError(null);
      setIsCapturing(true);
      await waitForNextFrame();
      const modalScreenshot = await captureElementAsPng(captureRef.current);
      await downloadParticipationReport({
        eventId,
        modalScreenshot,
      }).unwrap();
    } catch (downloadFailure: any) {
      setDownloadError(
        getRequestErrorMessage(
          downloadFailure,
          "No se pudo descargar el reporte de participación.",
        ),
      );
    } finally {
      downloadInFlightRef.current = false;
      setIsCapturing(false);
    }
  };

  return (
    <Modal2 isOpen={isOpen} onClose={onClose} showClose={false} size="xl" type="plain">
      <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-lg bg-white text-[#3D3D3D] shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-3xl leading-none text-[#666666] transition hover:bg-gray-100"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div ref={captureRef} data-testid="participation-analytics-capture">
          <div className="space-y-7 px-6 py-5 pr-16 sm:px-7 sm:pr-16">
            <div>
              <h2 className="text-[22px] font-bold leading-tight text-[#404040]">Analíticas</h2>
              <p className="mt-1 text-base font-normal text-[#777777]">
                {data?.votingName ?? "Votación"}
              </p>
              {data?.institutionName ? (
                <p className="mt-1 text-sm text-[#8A8A8A]">{data.institutionName}</p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[#E1E1E1]" />

          <div className="space-y-7 px-6 py-7 sm:px-7">
            {isFetching ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-[#777777]">
                Cargando analíticas...
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {getRequestErrorMessage(error as any, "No se pudieron cargar las analíticas.")}
              </div>
            ) : data ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Habilitados" value={data.totalEnabled} tone="enabled" />
                  <StatCard label="Participaron" value={data.totalParticipated} tone="participated" />
                  <StatCard label={pendingLabel} value={data.totalPending} tone="pending" />
                </div>

                <div className="grid gap-6 md:grid-cols-[184px_minmax(0,1fr)] md:items-start">
                  <div className="flex w-full flex-col items-center" data-testid="analytics-chart-column">
                    <div
                      aria-label={`Participación ${participationLabel}`}
                      data-testid="analytics-donut"
                      className="relative h-[150px] w-[150px] shrink-0"
                    >
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#2E7D32 0deg ${normalizedPercentage * 3.6}deg, #E3E6EA ${normalizedPercentage * 3.6}deg 360deg)`,
                          transform: "rotate(-90deg)",
                        }}
                      />
                      <div className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                    </div>
                    <div className="mt-4 w-[170px] space-y-1 text-left text-xl leading-tight">
                      <div className="flex items-center gap-2 text-[#2E7D32]">
                        <span className="h-3 w-3 bg-[#2E7D32]" aria-hidden="true" />
                        <span>Participaron</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#DDE1E6]">
                        <span className="h-3 w-3 bg-[#E3E6EA]" aria-hidden="true" />
                        <span>{pendingLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 text-lg text-[#7A7A7A]" data-testid="analytics-summary-column">
                    <div className="flex items-start justify-between gap-4 border-b border-[#DADADA] py-3">
                      <span>Participación</span>
                      <span className="font-semibold text-[#2E7D32]" data-testid="participation-percentage-value">
                        {participationLabel}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-[#DADADA] py-4">
                      <span>Estado</span>
                      <span className="max-w-[180px] text-right font-semibold leading-tight text-[#3D3D3D]">
                        {statusLabel}
                      </span>
                    </div>
                    {data.publishedAt ? (
                      <div className="flex items-start justify-between gap-4 py-4">
                        <span className="max-w-[120px]">Fecha publicación</span>
                        <span className="max-w-[180px] text-right font-medium leading-tight text-[#3D3D3D]">
                          {formatDateTimeForUi(data.publishedAt)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {hasNoEnabledVoters ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    No hay padrón habilitado para mostrar participación.
                  </div>
                ) : null}

                <div className="flex items-center gap-3 rounded-lg bg-[#F5F5F5] px-5 py-4 text-base text-[#777777]">
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#2E7D32] text-xs font-bold text-[#2E7D32]"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>No se muestra por quién votó ninguna persona.</span>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-[#777777]">
                No hay datos de participación disponibles.
              </div>
            )}
          </div>
        </div>

        {downloadError ? (
          <div className="mx-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7">
            {downloadError}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-4 px-6 pb-5 sm:flex-row sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] flex-1 rounded-lg border border-[#D8D8D8] bg-white px-6 py-3 text-base font-semibold text-[#444444] transition hover:bg-gray-50"
          >
            Cerrar
          </button>
          {canDownloadReport ? (
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={!data || isFetching || isReportBusy}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#2E7D32] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#25692a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-xl leading-none" aria-hidden="true">↓</span>
              {isReportBusy ? "Descargando..." : "Descargar reporte"}
            </button>
          ) : null}
        </div>
      </div>
    </Modal2>
  );
};

export default ParticipationAnalyticsModal;
