import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BanknotesIcon,
  ClipboardDocumentIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from '@/domains/votacion/navigation/compat-private';
import { useSelector } from 'react-redux';
import { useGetVotingEventsQuery } from '../../store/votingEvents';
import { selectTenantId, selectIsLoggedIn } from '../../store/auth/authSlice';
import type { VotingEvent } from '../../store/votingEvents/types';
import { formatDateTimeForUi, hasDraftAlreadyStarted, useClientNow } from '../electionConfig/renderUtils';
import EstimateVotersModal from '../adminTvd/components/EstimateVotersModal';
import { useGetMyTvdSummaryQuery } from '@/store/tvd';
import type { TvdMySummaryResponse } from '@/store/tvd';
import { copyTextToClipboard } from '../adminTvd/services/clipboard';
import {
  formatTvdDisplay,
  isWalletUpdateRequiredError,
} from '../adminTvd/utils/institutionalWalletUi';

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEADLINE_REMINDER_WINDOW_MS = 24 * ONE_HOUR_MS;

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  READY_FOR_REVIEW: 'En revisión previa',
  OFFICIALLY_PUBLISHED: 'Publicada oficialmente',
  PUBLICATION_EXPIRED: 'Caducada',
  ACTIVE: 'Activa',
  CLOSED: 'Finalizada',
  RESULTS_PUBLISHED: 'Resultados publicados',
  DISABLED: 'Deshabilitada',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-blue-100 text-blue-700',
  READY_FOR_REVIEW: 'bg-cyan-100 text-cyan-700',
  OFFICIALLY_PUBLISHED: 'bg-blue-100 text-blue-700',
  PUBLICATION_EXPIRED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-amber-100 text-amber-700',
  RESULTS_PUBLISHED: 'bg-violet-100 text-violet-700',
  DISABLED: 'bg-gray-200 text-gray-500',
};

const isInOfficialPublicationReminderWindow = (
  event: VotingEvent,
  nowMs: number | null,
) => {
  if (nowMs === null) return false;

  if (
    [
      'OFFICIALLY_PUBLISHED',
      'PUBLICATION_EXPIRED',
      'ACTIVE',
      'CLOSED',
      'RESULTS_PUBLISHED',
    ].includes(event.status)
  ) {
    return false;
  }

  if (!event.publishDeadline) return false;
  const publishDeadlineMs = new Date(event.publishDeadline).getTime();
  if (Number.isNaN(publishDeadlineMs)) return false;

  const timeUntilDeadline = publishDeadlineMs - nowMs;
  return timeUntilDeadline > 0 && timeUntilDeadline <= DEADLINE_REMINDER_WINDOW_MS;
};

const hasLinkedWallet = (summary: TvdMySummaryResponse | undefined) =>
  summary?.walletStatus !== 'MISSING' && Boolean(summary?.wallet);

const shortenMiddleAddress = (address: string) => {
  const normalized = address.trim();
  if (normalized.length <= 22) return normalized;
  return `${normalized.slice(0, 10)}...${normalized.slice(-8)}`;
};

const ElectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const tenantId = useSelector(selectTenantId);
  const nowMs = useClientNow();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Query de eventos - skip si no hay tenantId
  const { data: events = [], isLoading, error, refetch } = useGetVotingEventsQuery(
    tenantId ? { tenantId } : undefined,
    { skip: !isLoggedIn, refetchOnMountOrArgChange: true }
  );
  const {
    data: tvdSummary,
    isLoading: isTvdSummaryLoading,
    isFetching: isTvdSummaryFetching,
    error: tvdSummaryError,
    refetch: refetchTvdSummary,
  } = useGetMyTvdSummaryQuery(
    tenantId ? { tenantId } : undefined,
    { skip: !isLoggedIn || !tenantId, refetchOnMountOrArgChange: true },
  );

  const walletLinked = hasLinkedWallet(tvdSummary);
  const walletMissing =
    tvdSummary?.walletStatus === 'MISSING' ||
    isWalletUpdateRequiredError(tvdSummaryError);
  const balanceUnavailable =
    (Boolean(tvdSummaryError) && !isWalletUpdateRequiredError(tvdSummaryError)) ||
    (walletLinked && tvdSummary?.balanceStatus === 'UNAVAILABLE');
  const formattedTvdBalance =
    tvdSummary?.formattedBalance ?? tvdSummary?.totalBalance?.formatted ?? null;

  const isEmpty = events.length === 0;
  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return events;
    return events.filter((event) =>
      `${event.name} ${event.objective}`.toLowerCase().includes(term),
    );
  }, [events, searchTerm]);

  const handleCreateClick = () => {
    setShowEstimateModal(true);
  };

  const continueToCreateWizard = () => {
    setShowEstimateModal(false);
    navigate('/votacion/elecciones/new');
  };

  const handleRechargeFromEstimate = () => {
    setShowEstimateModal(false);
    navigate('/votacion/recarga-operativa');
  };

  const handleCopyWallet = async () => {
    if (!tvdSummary?.wallet) return;
    const copied = await copyTextToClipboard(tvdSummary.wallet);
    setCopyFeedback(copied ? 'Dirección copiada.' : 'No pudimos copiar la dirección.');
  };

  useEffect(() => {
    if (!copyFeedback) return;
    const timer = window.setTimeout(() => setCopyFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [copyFeedback]);

  const goToAccount = (action?: 'associate-account') => {
    navigate(
      action
        ? '/votacion/cuenta-institucional?action=associate-account'
        : '/votacion/cuenta-institucional',
    );
  };

  const handleElectionClick = (event: VotingEvent) => {
    if (hasDraftAlreadyStarted(event, nowMs) || event.status === 'PUBLICATION_EXPIRED') {
      return;
    }

    if (event.status === 'DRAFT') {
      // Ir a configuración (Paso 1)
      navigate(`/votacion/elecciones/${event.id}/config/cargos`);
    } else if (event.status === 'READY_FOR_REVIEW' || event.status === 'PUBLISHED') {
      navigate(`/votacion/elecciones/${event.id}/config/review`);
    } else if (
      event.status === 'OFFICIALLY_PUBLISHED' ||
      event.status === 'ACTIVE' ||
      event.status === 'CLOSED' ||
      event.status === 'RESULTS_PUBLISHED'
    ) {
      // Elección oficialmente publicada/activa/terminada - ir a vista de estado
      navigate(`/votacion/elecciones/${event.id}/status`);
    } else {
      // Fallback a review
      navigate(`/votacion/elecciones/${event.id}/config/review`);
    }
  };

  // Si no está logueado, redirigir a login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus elecciones</p>
          <button
            onClick={() => navigate('/votacion/login')}
            className="bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-6 py-2 rounded-lg"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#459151] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Cargando votaciones...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Error al cargar las votaciones</p>
          <button
            onClick={() => refetch()}
            className="bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Lista de elecciones (cuando hay al menos una)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {copyFeedback ? (
          <div
            role="status"
            className="fixed bottom-4 right-4 z-50 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg"
          >
            {copyFeedback}
          </div>
        ) : null}

        <div className="mb-7 grid items-stretch gap-4 lg:grid-cols-2">
          <section
            role="link"
            tabIndex={0}
            onClick={() => navigate('/votacion/recarga-operativa')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate('/votacion/recarga-operativa');
              }
            }}
            className="flex min-h-[108px] cursor-pointer items-center rounded-xl border border-[#cfe6d3] bg-[#fbfffb] px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#459151] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#459151]/25"
          >
            <div className="flex w-full items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[#2E6A38]/70">
                  Saldo
                </p>
                {isTvdSummaryLoading || isTvdSummaryFetching ? (
                  <div className="mt-2 h-9 w-28 animate-pulse rounded bg-green-100/70" />
                ) : walletLinked && formattedTvdBalance ? (
                  <p className="mt-1 flex flex-wrap items-baseline gap-2 text-3xl font-extrabold leading-tight text-[#2E6A38] sm:text-4xl">
                    <span>{formatTvdDisplay(formattedTvdBalance)}</span>
                    <span className="text-base font-extrabold sm:text-lg">$TVD</span>
                  </p>
                ) : walletMissing ? (
                  <p className="mt-2 text-sm font-semibold text-red-700" role="alert">
                    Cuenta pendiente
                  </p>
                ) : balanceUnavailable ? (
                  <p className="mt-2 text-sm font-semibold text-amber-800">
                    Saldo no disponible
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Saldo no disponible
                  </p>
                )}
              </div>
              {balanceUnavailable ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void refetchTvdSummary();
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-700 transition hover:bg-amber-50"
                  aria-label="Volver a intentar"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EFF7F0] text-[#2E6A38]">
                  <BanknotesIcon className="h-7 w-7" aria-hidden="true" />
                </span>
              )}
            </div>
          </section>

          <section
            role="link"
            tabIndex={0}
            onClick={() => goToAccount()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goToAccount();
              }
            }}
            className="flex min-h-[108px] w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/30 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300/40"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700/70">
                Cuenta
              </p>
              {isTvdSummaryLoading || isTvdSummaryFetching ? (
                <div className="mt-2 h-7 w-44 animate-pulse rounded bg-amber-100" />
              ) : walletLinked && tvdSummary?.wallet ? (
                <div className="mt-2 flex min-w-0 items-center gap-2">
                  <p
                    className="min-w-0 max-w-full truncate font-mono text-base font-bold leading-6 text-slate-900 sm:text-lg"
                    title={tvdSummary.wallet}
                  >
                    {shortenMiddleAddress(tvdSummary.wallet)}
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleCopyWallet();
                    }}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
                    aria-label="Copiar dirección"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Cuenta pendiente
                </p>
              )}
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <IdentificationIcon className="h-6 w-6" aria-hidden="true" />
            </span>
          </section>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Votaciones</h1>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Votación
          </button>
        </div>

        <div className="mb-5">
          <label htmlFor="election-search" className="sr-only">
            Buscar votación
          </label>
          <input
            id="election-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar votación..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
          />
        </div>

        {/* Lista de elecciones */}
        <div className="grid gap-4">
          {isEmpty ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Bienvenido a Tu voto decide
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Crea tu primera votación para configurar cargos, candidatos y padrón.
              </p>
              <button
                type="button"
                onClick={handleCreateClick}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#459151] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3a7a44]"
              >
                Crear votación
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No encontramos votaciones con ese criterio.
            </div>
          ) : filteredEvents.map((event) => {
            const publicationReminderActive = isInOfficialPublicationReminderWindow(event, nowMs);
            const startAlreadyExpired = hasDraftAlreadyStarted(event, nowMs);
            const expiredElection = event.status === 'PUBLICATION_EXPIRED';
            const blockedCard = startAlreadyExpired || expiredElection;
            const participationPercentage = Number(
              (event as any).participationPercentage ??
                (event as any).participation?.percentage ??
                NaN,
            );
            const hasParticipationPercentage = Number.isFinite(participationPercentage);

            return (
              <div
                key={event.id}
                onClick={blockedCard ? undefined : () => handleElectionClick(event)}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  blockedCard
                    ? expiredElection
                      ? 'border-red-200 bg-red-50/40 cursor-default'
                      : 'border-amber-200 bg-amber-50/40 cursor-default'
                    : publicationReminderActive
                      ? 'border-yellow-300 bg-yellow-50/30 hover:border-yellow-500 hover:shadow-md cursor-pointer'
                      : 'border-gray-200 hover:shadow-md hover:border-[#459151] cursor-pointer'
                }`}
              >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {event.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {event.objective}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {startAlreadyExpired ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Inicio vencido
                      </span>
                    ) : expiredElection ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Caducada
                      </span>
                    ) : (
                      <>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[event.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {statusLabels[event.status] || event.status}
                        </span>
                        {event.status === 'DRAFT' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Pendiente de configurar
                          </span>
                        )}
                        {publicationReminderActive && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-700">
                            Publicación pendiente
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-500 space-y-2">
                  {hasParticipationPercentage && (
                    <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {participationPercentage.toFixed(1)}%
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Inicio:</span> {formatDateTimeForUi(event.votingStart)}
                  </p>
                  <p>
                    <span className="font-medium">Cierre:</span> {formatDateTimeForUi(event.votingEnd)}
                  </p>
                </div>
              </div>
              {startAlreadyExpired && (
                <p className="mt-4 text-sm text-amber-800">
                  Esta votación ya alcanzó su hora de inicio sin estar lista. Crea una nueva votación para continuar.
                </p>
              )}
              {publicationReminderActive && event.publishDeadline && (
                <p className="mt-4 text-sm text-amber-800">
                  Recuerda confirmar la publicación oficial antes del {formatDateTimeForUi(event.publishDeadline)}  
                </p>
              )}
              {expiredElection && (
                <p className="mt-4 text-sm text-red-800">
                  Esta elección quedó caducada porque la ventana de publicación oficial venció. Ya no puede modificarse ni publicarse.
                </p>
              )}
              </div>
            );
          })}
        </div>
      </div>

      <EstimateVotersModal
        isOpen={showEstimateModal}
        tenantId={tenantId}
        onClose={() => setShowEstimateModal(false)}
        onContinue={continueToCreateWizard}
        onRecharge={handleRechargeFromEstimate}
      />
    </div>
  );
};

export default ElectionsPage;
