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
import { useElectionPublish } from './data/useElectionPublish';
import Modal2 from '../../components/Modal2';
import ConfigPageFallback from './components/ConfigPageFallback';
import {
  canEditElectionBeforeCutoff,
  hasDraftAlreadyStarted,
  hasVotingEnded,
  isDuringVotingWindow,
  useClientNow,
} from './renderUtils';
import { useDeleteVotingEventMutation } from '../../store/votingEvents';

const pendingLabels: Record<string, string> = {
  datos_base: 'Datos base de la votación',
  horarios: 'Cronograma completo y válido',
  publish_deadline: 'Ventana de publicación de 24 horas',
  cargos: 'Cargos configurados',
  opciones: 'Planchas registradas',
  candidatos: 'Candidatos asignados',
  candidatos_invalidos: 'Candidatos con cargos válidos',
  cobertura_cargos: 'Cobertura de todos los cargos',
  padron: 'Padrón cargado',
  padron_invalid: 'Padrón sin registros inválidos',
  padron_validation: 'Confirmar la versión final del padrón',
  publication_window_expired: 'La ventana de publicación oficial venció',
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
  const didRefetchOnMount = useRef(false);

  useEffect(() => {
    if (!actualElectionId) return;
    if (didRefetchOnMount.current) return;
    didRefetchOnMount.current = true;
    refetch();
  }, [actualElectionId, refetch]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

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
  const canOpenReview = eventState === 'DRAFT' && isReadyToPublish && reviewReadiness?.isReady;
  const canConfirmOfficialPublication =
    eventState === 'READY_FOR_REVIEW' &&
    isReadyToPublish &&
    reviewReadiness?.publicationWindow?.canConfirmOfficialPublication;
  const isPublicationExpired =
    eventState === 'PUBLICATION_EXPIRED' || Boolean(reviewReadiness?.publicationWindow?.expired);

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
            Así verán los votantes las papeletas. Revisa antes de publicar.
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
                <BallotPreview parties={ballotPreview?.parties || []} />
              </PhoneMockup>
            </div>

            {/* Columna derecha: Resumen (mobile: arriba, desktop: lado) */}
            <div className="w-full lg:w-80 order-first lg:order-last space-y-4">
              {reviewReadiness && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
                  <h2 className="font-semibold text-gray-800">Revisión previa</h2>
                  {reviewReadiness.isReady ? (
                    <p className="mt-2 text-green-700">
                      {eventState === 'READY_FOR_REVIEW'
                        ? 'La revisión previa está abierta. Ya puedes confirmar la publicación oficial dentro de la ventana permitida.'
                        : 'La configuración está completa para notificar a los votantes.'}
                    </p>
                  ) : (
                    <div className="mt-2 text-amber-800">
                      <p>Faltan estos puntos antes de notificar a los votantes:</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {reviewReadiness.pending.map((item) => (
                          <li key={item}>{pendingLabels[item] ?? item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {reviewReadiness.publicationWindow?.deadline && (
                    <p className="mt-3 text-xs text-gray-500">
                      La publicación oficial debe confirmarse antes del límite de publicación oficial, 24 horas antes del inicio.
                    </p>
                  )}
                </div>
              )}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <h2 className="font-semibold">Etapa 1: revisión y notificación</h2>
                <p className="mt-2">
                  Notifica a los empadronados y deja constancia de revisión previa. No equivale a publicación oficial.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <h2 className="font-semibold">Etapa 2: publicación oficial</h2>
                <p className="mt-2">
                  La confirmación oficial ocurre después y sigue separada de la revisión. El límite de publicación oficial llega 24 horas antes del inicio.
                </p>

              </div>
              {fullElectionEditingEnabled ? (
                <div className="rounded-lg border border-emerald-200 bg-white p-4 text-sm text-emerald-800 shadow-sm">
                  Antes del límite de publicación oficial puedes volver a editar toda la elección aunque ya exista padrón confirmado, revisión abierta o publicación oficial.
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
              {configSummary && <ConfigSummaryCard summary={configSummary} />}
              <ScheduleSummaryCard
                votingStart={votingEvent?.votingStart}
                votingEnd={votingEvent?.votingEnd}
                resultsPublishAt={votingEvent?.resultsPublishAt}
                compact
              />
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
    </div>
  );
};

export default ElectionConfigReview;
