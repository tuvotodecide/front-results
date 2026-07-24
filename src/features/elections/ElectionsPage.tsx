// Página principal de Elecciones
// Muestra el dashboard institucional y conserva la lista real de votaciones
// Conectado a backend real con RTK Query

import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/domains/votacion/navigation/compat-private';
import { useSelector } from 'react-redux';
import { useDeleteVotingEventMutation, useDisableVotingEventMutation, useGetVotingEventsQuery } from '../../store/votingEvents';
import { selectTenantId, selectIsLoggedIn } from '../../store/auth/authSlice';
import Modal2 from '../../components/Modal2';
import type { VotingEvent } from '../../store/votingEvents/types';
import { formatDateTimeForUi, hasDraftAlreadyStarted, useClientNow } from '../electionConfig/renderUtils';
import AdminInstitutionAccountCard from '../adminTvd/components/AdminInstitutionAccountCard';
import EstimateVotersModal from '../adminTvd/components/EstimateVotersModal';

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEADLINE_REMINDER_WINDOW_MS = 24 * ONE_HOUR_MS;

// Mapear estados del backend a labels en español
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

const canDeleteEvent = (event: VotingEvent) =>
  ['DRAFT', 'READY_FOR_REVIEW', 'PUBLICATION_EXPIRED'].includes(event.status);
const canDisableEvent = (event: VotingEvent) =>
  event.status === 'OFFICIALLY_PUBLISHED';

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

const ElectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const tenantId = useSelector(selectTenantId);
  const nowMs = useClientNow();
  const [deleteVotingEvent, { isLoading: deleting }] = useDeleteVotingEventMutation();
  const [disableVotingEvent, { isLoading: disabling }] = useDisableVotingEventMutation();
  const [deleteConfirm, setDeleteConfirm] = useState<VotingEvent | null>(null);
  const [disableConfirm, setDisableConfirm] = useState<VotingEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEstimateModal, setShowEstimateModal] = useState(false);

  // Query de eventos - skip si no hay tenantId
  const { data: events = [], isLoading, error, refetch } = useGetVotingEventsQuery(
    tenantId ? { tenantId } : undefined,
    { skip: !isLoggedIn, refetchOnMountOrArgChange: true }
  );

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

  const handleDeleteElection = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteVotingEvent(deleteConfirm.id).unwrap();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error eliminando votación:', error);
    }
  };

  const handleDisableElection = async () => {
    if (!disableConfirm) return;
    try {
      await disableVotingEvent(disableConfirm.id).unwrap();
      setDisableConfirm(null);
    } catch (error) {
      console.error('Error deshabilitando votación:', error);
    }
  }

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
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/votacion/recarga-operativa')}
            className="flex min-h-[96px] w-full items-center justify-between rounded-2xl border border-amber-300 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
            aria-label="Ir a recarga operativa"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Recarga operativa
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Recarga TVD mediante QR
              </p>
              <p className="mt-1 text-xs text-slate-500">
                El saldo se valida en backend con tu wallet activa.
              </p>
            </div>
          </button>
          <AdminInstitutionAccountCard
            onClick={() => navigate('/votacion/cuenta-institucional')}
          />
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
                  {canDeleteEvent(event) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(event);
                      }}
                      disabled={deleting}
                      className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  )}
                  {canDisableEvent(event) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDisableConfirm(event);
                      }}
                      disabled={deleting}
                      className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Deshabilitar
                    </button>
                  )}
                </div>
              </div>
              {startAlreadyExpired && (
                <p className="mt-4 text-sm text-amber-800">
                  Esta votación ya alcanzó su hora de inicio sin estar lista. No debería seguir configurándose; elimínala y crea una nueva.
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

      <Modal2
        isOpen={!!deleteConfirm || !!disableConfirm}
        onClose={() => {
          setDeleteConfirm(null);
          setDisableConfirm(null);
        }}
        title={disableConfirm ? "Deshabilitar votación" : "Eliminar votación"}
        size="sm"
        type="plain"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {disableConfirm
                    ? `¿Estás seguro de deshabilitar la votación "${disableConfirm.name}"?`
                    : `¿Estás seguro de eliminar la votación "${deleteConfirm?.name}"?`}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {disableConfirm
                    ? "Los votantes ya no verán esta votación ni podrán votar, pero la configuración y resultados se mantendrán accesibles para el organizador."
                    : "Esta acción eliminará la votación y no se puede deshacer."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirm(null);
                setDisableConfirm(null);
              }}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (disableConfirm) {
                  handleDisableElection();
                } else {
                  handleDeleteElection();
                }
              }}
              disabled={deleting || disabling}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting || disabling ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              <span>{deleting ? 'Eliminando...' : disabling ? 'Deshabilitando...' : disableConfirm ? 'Deshabilitar' : 'Eliminar'}</span>
            </button>
          </div>
        </div>
      </Modal2>

      <EstimateVotersModal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        onContinue={continueToCreateWizard}
        onRecharge={handleRechargeFromEstimate}
      />
    </div>
  );
};

export default ElectionsPage;
