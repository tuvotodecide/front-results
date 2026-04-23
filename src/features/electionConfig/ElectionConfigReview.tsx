// Página de revisión final antes de publicar la elección
// Basado en capturas 01-04

import React, { useEffect, useRef, useState } from 'react';
import {
  useNavigate,
  useParams,
} from '@/domains/votacion/navigation/compat-private';
import PhoneMockup from './components/PhoneMockup';
import BallotPreview from './components/BallotPreview';
import ConfigSummaryCard from './components/ConfigSummaryCard';
import ScheduleSummaryCard from './components/ScheduleSummaryCard';
import ConfirmActivateModal from './components/ConfirmActivateModal';
import ActivatedSuccessModal from './components/ActivatedSuccessModal';
import CreateNewsModal from './components/CreateNewsModal';
import { useElectionPublish } from './data/useElectionPublish';
import Modal2 from '../../components/Modal2';
import ConfigPageFallback from './components/ConfigPageFallback';
import { getRequestErrorMessage } from './requestErrorMessage';
import {
  addMinutesToLocalDateTime,
  canEditElectionBeforeCutoff,
  formatDateTimeForUi,
  getMinimumLocalDateTime,
  hasDraftAlreadyStarted,
  hasVotingEnded,
  isDuringVotingWindow,
  PRE_PUBLICATION_CUTOFF_HOURS,
  PRE_PUBLICATION_CUTOFF_MS,
  toLocalDateTimeValue,
  useClientNow,
  validateScheduleFieldErrors,
} from './renderUtils';
import {
  useCreateEventNewsMutation,
  useCreatePresentialSessionMutation,
  useDeleteVotingEventMutation,
  useUpdateEventScheduleMutation,
  useUpdateVotingEventMutation,
} from '../../store/votingEvents';

const basePendingLabels: Record<string, string> = {
  datos_base: 'Datos base de la votación',
  horarios: 'Cronograma completo y válido',
  publish_deadline: `Ventana de publicación de ${PRE_PUBLICATION_CUTOFF_HOURS} horas`,
  cargos: 'Cargos configurados',
  opciones: 'Planchas registradas',
  candidatos: 'Candidatos asignados',
  candidatos_invalidos: 'Candidatos configurados correctamente',
  cobertura_cargos: 'Cobertura completa de cargos',
  padron: 'Padrón cargado',
  padron_invalid: 'Padrón sin errores de registro',
  padron_validation: 'Padrón listo para revisión',
  publication_window_expired: 'La ventana de publicación oficial venció',
};

const getPendingLabel = (key: string, isReferendum: boolean) => {
  if (!isReferendum) return basePendingLabels[key] ?? key;

  const referendumLabels: Record<string, string> = {
    cargos: 'Consulta lista',
    opciones: 'Opciones registradas',
    candidatos: 'Opciones configuradas',
    candidatos_invalidos: 'Opciones configuradas correctamente',
    cobertura_cargos: 'Consulta completa',
  };

  return referendumLabels[key] ?? basePendingLabels[key] ?? key;
};

const ElectionConfigReview: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || '';
  const nowMs = useClientNow();

  const {
    votingEvent,
    ballotPreview,
    configSummary,
    reviewReadiness,
    loading,
    openReview,
    openingReview,
    activateElection,
    activating,
    activationResult,
    copyToClipboard,
    refetch,
  } = useElectionPublish(actualElectionId);
  const [deleteVotingEvent, { isLoading: deletingEvent }] = useDeleteVotingEventMutation();
  const [updateEventSchedule, { isLoading: updatingSchedule }] = useUpdateEventScheduleMutation();
  const [updateVotingEvent, { isLoading: updatingPresentialOption }] = useUpdateVotingEventMutation();
  const [createPresentialSession, { isLoading: enablingPresentialOption }] =
    useCreatePresentialSessionMutation();
  const [createEventNews, { isLoading: creatingNews }] = useCreateEventNewsMutation();
  const didRefetchOnMount = useRef(false);

  useEffect(() => {
    if (!actualElectionId) return;
    if (didRefetchOnMount.current) return;
    didRefetchOnMount.current = true;
    refetch();
  }, [actualElectionId, refetch]);

  useEffect(() => {
    setScheduleForm({
      votingStart: votingEvent?.votingStart
        ? toLocalDateTimeValue(new Date(votingEvent.votingStart))
        : '',
      votingEnd: votingEvent?.votingEnd
        ? toLocalDateTimeValue(new Date(votingEvent.votingEnd))
        : '',
      resultsPublishAt: votingEvent?.resultsPublishAt
        ? toLocalDateTimeValue(new Date(votingEvent.resultsPublishAt))
        : '',
    });
  }, [votingEvent?.resultsPublishAt, votingEvent?.votingEnd, votingEvent?.votingStart]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [newsSuccess, setNewsSuccess] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [presentialMessage, setPresentialMessage] = useState<string | null>(null);
  const [presentialError, setPresentialError] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    votingStart: '',
    votingEnd: '',
    resultsPublishAt: '',
  });
  const minimumVotingStartValue = getMinimumLocalDateTime(
    PRE_PUBLICATION_CUTOFF_MS,
    nowMs ?? Date.now(),
  );

  const isReadyToPublish = configSummary
    ? configSummary.positionsOk && configSummary.partiesOk && configSummary.padronOk
    : false;

  const handleBackToEdit = () => {
    navigate(`/votacion/elecciones/${actualElectionId}/config/cargos`);
  };

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleOpenReview = async () => {
    try {
      await openReview();
    } catch (error: any) {
      setShowErrorModal(true);
      console.error('Error opening review:', error);
    }
  };

  const handleActivate = async () => {
    try {
      if (!votingEvent) {
        throw new Error('Could not load voting event data');
      }
      await activateElection();
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowConfirmModal(false);
      setShowErrorModal(true);
      console.error('Error activating election:', error);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Navegar al dashboard o detalle de la elección
    navigate('/votacion/elecciones');
  };

  const handleDeleteExpired = async () => {
    if (!actualElectionId) return;
    await deleteVotingEvent(actualElectionId).unwrap();
    navigate('/votacion/elecciones');
  };

  const isPublishButtonDisabled = () => {
    return (
      !isReadyToPublish || activating || reviewReadiness?.publicationWindow?.expired
    );
  }

  const eventState = votingEvent?.state ?? votingEvent?.status ?? 'DRAFT';
  const fullElectionEditingEnabled = canEditElectionBeforeCutoff(votingEvent, nowMs);
  const votingInProgress = isDuringVotingWindow(votingEvent, nowMs);
  const votingClosed = hasVotingEnded(votingEvent, nowMs);
  const scheduleEditable = canEditElectionBeforeCutoff(votingEvent, nowMs);
  const canOpenReview = eventState === 'DRAFT' && isReadyToPublish && reviewReadiness?.isReady;
  const canConfirmOfficialPublication =
    eventState === 'READY_FOR_REVIEW' &&
    isReadyToPublish &&
    reviewReadiness?.publicationWindow?.canConfirmOfficialPublication;
  const reviewAlreadyNotified =
    eventState === 'READY_FOR_REVIEW' ||
    eventState === 'PUBLISHED' ||
    eventState === 'OFFICIALLY_PUBLISHED' ||
    votingInProgress ||
    votingClosed;
  const isPublicationExpired =
    eventState === 'PUBLICATION_EXPIRED' || Boolean(reviewReadiness?.publicationWindow?.expired);
  const presentialKioskEnabled = Boolean(votingEvent?.presentialKioskEnabled);
  const canChangePresentialOption =
    fullElectionEditingEnabled &&
    !isPublicationExpired &&
    !votingInProgress &&
    !votingClosed;
  const savingPresentialOption = updatingPresentialOption || enablingPresentialOption;
  const scheduleFieldErrors = validateScheduleFieldErrors(scheduleForm, {
    nowMs: nowMs ?? Date.now(),
    minimumStartLeadMs: PRE_PUBLICATION_CUTOFF_MS,
    minimumStartMessage: `La fecha de inicio debe quedar al menos ${PRE_PUBLICATION_CUTOFF_HOURS} horas por delante para conservar la ventana de modificación y publicación oficial.`,
  });
  const hasScheduleFieldErrors = Object.keys(scheduleFieldErrors).length > 0;
  const publicationDeadlineLabel = formatDateTimeForUi(
    reviewReadiness?.publicationWindow?.deadline ?? votingEvent?.publishDeadline,
  );

  const handlePresentialToggle = async (enabled: boolean) => {
    if (!actualElectionId || !canChangePresentialOption || savingPresentialOption) {
      return;
    }

    setPresentialMessage(null);
    setPresentialError(null);

    try {
      if (enabled) {
        await createPresentialSession({
          eventId: actualElectionId,
          data: { regenerateKioskAccessToken: false },
        }).unwrap();
      } else {
        await updateVotingEvent({
          eventId: actualElectionId,
          data: { presentialKioskEnabled: false },
        }).unwrap();
      }

      await refetch();
      setPresentialMessage(
        enabled ? 'Voto presencial activado.' : 'Voto presencial desactivado.',
      );
    } catch (error: any) {
      const message = getRequestErrorMessage(
        error,
        'No se pudo cambiar esta opción. Intenta nuevamente.',
      );
      setPresentialError(message);
    }
  };

  const handleScheduleInputChange = (
    key: 'votingStart' | 'votingEnd' | 'resultsPublishAt',
    value: string,
  ) => {
    setScheduleForm((current) => ({ ...current, [key]: value }));
    setScheduleError(null);
    setScheduleSuccess(null);
  };

  const handleScheduleSave = async () => {
    if (!scheduleEditable || !actualElectionId) return;

    if (hasScheduleFieldErrors) {
      setScheduleError(
        scheduleFieldErrors.votingStart ??
          scheduleFieldErrors.votingEnd ??
          scheduleFieldErrors.resultsPublishAt ??
          'Corrige las fechas antes de guardar el cronograma.',
      );
      return;
    }

    try {
      await updateEventSchedule({
        eventId: actualElectionId,
        data: {
          votingStart: new Date(scheduleForm.votingStart).toISOString(),
          votingEnd: new Date(scheduleForm.votingEnd).toISOString(),
          resultsPublishAt: new Date(scheduleForm.resultsPublishAt).toISOString(),
        },
      }).unwrap();

      await refetch();
      setScheduleSuccess('Horario actualizado correctamente.');
      setScheduleError(null);
      setIsScheduleModalOpen(false);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        'No se pudo actualizar el horario.';
      setScheduleError(String(message));
    }
  };

  const handleCreateNews = async (payload: {
    title: string;
    body: string;
    link?: string;
    imageUrl?: string;
  }) => {
    if (!actualElectionId) return;

    try {
      const result = await createEventNews({
        eventId: actualElectionId,
        data: payload,
      }).unwrap();
      setNewsError(null);
      setNewsSuccess(
        result.imageUrl
          ? 'Noticia publicada correctamente con imagen.'
          : 'Noticia publicada correctamente para los votantes del padrón actual.',
      );
      setIsNewsModalOpen(false);
    } catch (error: any) {
      const message = getRequestErrorMessage(error, 'No se pudo publicar la noticia.');
      setNewsSuccess(null);
      setNewsError(message);
      throw new Error(message);
    }
  };

  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => navigate('/votacion/elecciones')}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando vista previa...</p>
        </div>
      </div>
    );
  }

  if (hasDraftAlreadyStarted(votingEvent, nowMs)) {
    return (
      <ConfigPageFallback
        title="La votación ya venció antes de completarse"
        message="Como la hora de inicio ya pasó y el evento sigue en borrador, ya no debe publicarse ni seguir configurándose. Elimínalo desde la lista de votaciones."
        actionLabel="Volver a elecciones"
        onAction={() => navigate('/votacion/elecciones')}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex flex-col">
      {/* Contenido principal */}
      <div className="py-8 flex-1">
        <div className="max-w-6xl mx-auto px-4">
          {/* Título */}
          <h1 className="text-xl md:text-2xl font-semibold text-gray-700 text-center mb-8">
            {ballotPreview?.isReferendum
              ? 'Así verán los votantes la consulta. Revisa antes de publicar.'
              : 'Así verán los votantes las papeletas. Revisa antes de publicar.'}
          </h1>

          {/* Contenido: Preview + Resumen */}
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* Columna izquierda: Etiqueta + Phone Preview */}
            <div className="w-full lg:w-auto flex flex-col items-center">
              {/* Etiqueta Vista previa */}
              <div className="mb-4">
                <span className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white">
                  Vista previa móvil
                </span>
              </div>

              {/* Phone Mockup */}
              <PhoneMockup>
                <BallotPreview
                  parties={ballotPreview?.parties || []}
                  isReferendum={ballotPreview?.isReferendum}
                  question={ballotPreview?.electionObjective}
                />
              </PhoneMockup>
            </div>

            {/* Columna derecha: Resumen (mobile: arriba, desktop: lado) */}
            <div className="w-full lg:w-80 order-first lg:order-last space-y-4">
              {reviewReadiness && !reviewReadiness.isReady ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                  <p className="font-semibold">Faltan estos puntos antes de notificar a los votantes:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {reviewReadiness.pending.map((item) => (
                      <li key={item}>{getPendingLabel(item, Boolean(ballotPreview?.isReferendum))}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Usar voto presencial con QR
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Opcional para punto presencial.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={presentialKioskEnabled}
                    disabled={!canChangePresentialOption || savingPresentialOption}
                    onClick={() => void handlePresentialToggle(!presentialKioskEnabled)}
                    className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      presentialKioskEnabled ? 'bg-[#459151]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        presentialKioskEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {presentialMessage ? (
                  <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    {presentialMessage}
                  </p>
                ) : null}
                {presentialError ? (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {presentialError}
                  </p>
                ) : null}
              </div>
              {newsSuccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm">
                  {newsSuccess}
                </div>
              ) : null}
              {newsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                  {newsError}
                </div>
              ) : null}
              {votingInProgress ? (
                <div className="rounded-lg border border-blue-200 bg-white p-4 text-sm text-blue-800 shadow-sm">
                  La votación está activa. La revisión y la publicación oficial ya no se gestionan desde esta vista.
                </div>
              ) : null}
              {votingClosed ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                  La votación ya finalizó. Esta vista queda solo para consulta histórica.
                </div>
              ) : null}
              {isPublicationExpired && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  La ventana de publicación oficial venció. Esta votación ya no debe editarse como borrador ni publicarse normalmente.
                </div>
              )}

              {!isPublicationExpired ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                  <p className="font-semibold">Plazo de modificación y publicación oficial</p>
                  <p className="mt-1">
                    Puedes modificar y confirmar la publicación oficial hasta {publicationDeadlineLabel}. Si faltan menos de {PRE_PUBLICATION_CUTOFF_HOURS} horas para el inicio, ambas acciones quedan bloqueadas.
                  </p>
                </div>
              ) : null}
              {scheduleSuccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {scheduleSuccess}
                </div>
              ) : null}
              {configSummary && (
                <ConfigSummaryCard
                  summary={configSummary}
                  isReferendum={Boolean(ballotPreview?.isReferendum)}
                />
              )}
              <div className="space-y-3">
                <ScheduleSummaryCard
                  votingStart={votingEvent?.votingStart}
                  votingEnd={votingEvent?.votingEnd}
                  resultsPublishAt={votingEvent?.resultsPublishAt}
                  compact
                />
                {scheduleEditable ? (
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleError(null);
                      setScheduleSuccess(null);
                      setIsScheduleModalOpen(true);
                    }}
                    className="w-full rounded-lg border border-[#459151]/20 bg-[#EFF7F0] px-4 py-3 text-sm font-medium text-[#2E6A38] transition-colors hover:bg-[#E4F3E7]"
                  >
                    Modificar horarios
                  </button>
                ) : null}
                {reviewAlreadyNotified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewsError(null);
                      setNewsSuccess(null);
                      setIsNewsModalOpen(true);
                    }}
                    className="w-full rounded-lg border border-[#459151]/20 bg-white px-4 py-3 text-sm font-semibold text-[#2E6A38] transition-colors hover:bg-[#EFF7F0]"
                  >
                    Crear noticia
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Botón volver */}
            {!isPublicationExpired ? (
              <button
                type="button"
                onClick={handleBackToEdit}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Volver a editar
              </button>
            ) : (
              <span className="w-full text-sm text-red-700 sm:w-auto">
                La votación vencida no se edita.
              </span>
            )}

            {/* Botón confirmar */}
            <div className="w-full sm:w-auto text-center sm:text-right">
              {reviewReadiness?.publicationWindow?.expired ? (
                <p className="mb-2 text-sm text-red-700">
                  Ya no se puede publicar oficialmente porque el plazo cerró el {publicationDeadlineLabel}.
                </p>
              ) : null}
              {isPublicationExpired ? (
                <button
                  type="button"
                  onClick={handleDeleteExpired}
                  disabled={deletingEvent}
                  className="w-full rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {deletingEvent ? 'Eliminando...' : 'Eliminar votación vencida'}
                </button>
              ) : votingInProgress ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-8 py-3 font-semibold text-gray-500 sm:w-auto"
                >
                  La votación ya está activa
                </button>
              ) : votingClosed ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-8 py-3 font-semibold text-gray-500 sm:w-auto"
                >
                  La votación ya finalizó
                </button>
              ) : eventState === 'OFFICIALLY_PUBLISHED' ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-8 py-3 font-semibold text-gray-500 sm:w-auto"
                >
                  Publicación oficial confirmada
                </button>
              ) : eventState === 'READY_FOR_REVIEW' || eventState === 'PUBLISHED' ? (
                <button
                  type="button"
                  onClick={handleConfirmClick}
                  disabled={isPublishButtonDisabled() || !canConfirmOfficialPublication}
                  className={`
                    w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-all
                    ${!isPublishButtonDisabled() && canConfirmOfficialPublication
                      ? 'bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  Confirmar publicación oficial
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenReview}
                  disabled={!canOpenReview || openingReview}
                  className={`
                    w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-all
                    ${canOpenReview && !openingReview
                      ? 'bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {openingReview ? 'Notificando...' : 'Notificar a los votantes'}
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmActivateModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleActivate}
        isLoading={activating}
        isReferendum={Boolean(ballotPreview?.isReferendum)}
      />

      {/* Modal de éxito */}
      <ActivatedSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        publicUrl={activationResult?.publicUrl || ''}
        shareText={activationResult?.shareText || ''}
        onCopyLink={copyToClipboard}
      />

      <Modal2
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title='Operación fallida'
        type='error'
        showClose
        closeOnEscape
      >
        Operación fallida. No se ha publicado la votación. Intenta nuevamente o contacta al soporte si el problema persiste.
      </Modal2>

      <Modal2
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleError(null);
        }}
        title="Modificar horarios"
        size="lg"
      >
        <div className="space-y-5">
          {scheduleError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {scheduleError}
            </div>
          ) : null}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Límite para modificar y publicar oficialmente</p>
            <p className="mt-1">
              La elección solo puede seguir modificándose y publicándose hasta {publicationDeadlineLabel}. La nueva fecha de inicio debe quedar al menos {PRE_PUBLICATION_CUTOFF_HOURS} horas por delante.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Inicio de votación</span>
              <input
                type="datetime-local"
                value={scheduleForm.votingStart}
                min={minimumVotingStartValue}
                onChange={(event) => handleScheduleInputChange('votingStart', event.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#459151]/15 ${
                  scheduleFieldErrors.votingStart
                    ? 'border border-red-300 bg-red-50 focus:border-red-400'
                    : 'border border-slate-300 focus:border-[#459151]'
                }`}
              />
              <p className="mt-1 text-xs text-slate-500">
                Debe quedar al menos {PRE_PUBLICATION_CUTOFF_HOURS} horas adelante.
              </p>
              {scheduleFieldErrors.votingStart ? (
                <p className="mt-1 text-sm text-red-600">{scheduleFieldErrors.votingStart}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Cierre de votación</span>
              <input
                type="datetime-local"
                value={scheduleForm.votingEnd}
                min={scheduleForm.votingStart || minimumVotingStartValue}
                onChange={(event) => handleScheduleInputChange('votingEnd', event.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#459151]/15 ${
                  scheduleFieldErrors.votingEnd
                    ? 'border border-red-300 bg-red-50 focus:border-red-400'
                    : 'border border-slate-300 focus:border-[#459151]'
                }`}
              />
              {scheduleFieldErrors.votingEnd ? (
                <p className="mt-1 text-sm text-red-600">{scheduleFieldErrors.votingEnd}</p>
              ) : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Publicación de resultados</span>
            <input
              type="datetime-local"
              value={scheduleForm.resultsPublishAt}
              min={addMinutesToLocalDateTime(
                scheduleForm.votingEnd,
                1,
                scheduleForm.votingStart || minimumVotingStartValue,
              )}
              onChange={(event) => handleScheduleInputChange('resultsPublishAt', event.target.value)}
              className={`w-full rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#459151]/15 ${
                scheduleFieldErrors.resultsPublishAt
                  ? 'border border-red-300 bg-red-50 focus:border-red-400'
                  : 'border border-slate-300 focus:border-[#459151]'
              }`}
            />
            <p className="mt-1 text-xs text-slate-500">
              Debe publicarse al menos 1 minuto después del cierre.
            </p>
            {scheduleFieldErrors.resultsPublishAt ? (
              <p className="mt-1 text-sm text-red-600">{scheduleFieldErrors.resultsPublishAt}</p>
            ) : null}
          </label>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-800">Inicio:</span> {formatDateTimeForUi(votingEvent?.votingStart)}</p>
            <p className="mt-1"><span className="font-semibold text-slate-800">Cierre:</span> {formatDateTimeForUi(votingEvent?.votingEnd)}</p>
            <p className="mt-1"><span className="font-semibold text-slate-800">Resultados:</span> {formatDateTimeForUi(votingEvent?.resultsPublishAt)}</p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              disabled={updatingSchedule}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleScheduleSave()}
              disabled={updatingSchedule || hasScheduleFieldErrors}
              className="inline-flex items-center justify-center rounded-xl bg-[#459151] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44] disabled:opacity-50"
            >
              {updatingSchedule ? 'Guardando...' : 'Guardar horarios'}
            </button>
          </div>
        </div>
      </Modal2>

      <CreateNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onSubmit={handleCreateNews}
        isLoading={creatingNews}
      />
    </div>
  );
};

export default ElectionConfigReview;
