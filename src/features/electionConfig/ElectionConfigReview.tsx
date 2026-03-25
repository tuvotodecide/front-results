// Página de revisión final antes de publicar la elección
// Basado en capturas 01-04

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PhoneMockup from './components/PhoneMockup';
import BallotPreview from './components/BallotPreview';
import ConfigSummaryCard from './components/ConfigSummaryCard';
import ConfirmActivateModal from './components/ConfirmActivateModal';
import ActivatedSuccessModal from './components/ActivatedSuccessModal';
import { useElectionPublish } from './data/useElectionPublish';
import { useWallet } from '../../hooks/useWallet';
import Modal2 from '../../components/Modal2';
import ConfigPageFallback from './components/ConfigPageFallback';

const ElectionConfigReview: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || '';

  const {
    connectionState,
    transactionState,
    connectWallet,
    callCreateVoting,
    resetTransactionState,
  } = useWallet();

  const {
    votingEvent,
    ballotPreview,
    configSummary,
    loading,
    activateElection,
    activating,
    activationResult,
    copyToClipboard,
    refetch,
  } = useElectionPublish(actualElectionId);

  useEffect(() => {
    refetch();
  }, []);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isReadyToPublish = configSummary
    ? configSummary.positionsOk && configSummary.partiesOk && configSummary.padronOk
    : false;

  const handleBackToEdit = () => {
    navigate(`/elections/${actualElectionId}/config/cargos`);
  };

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleActivate = async () => {
    try {
      if (!votingEvent) {
        throw new Error('Could not load voting event data');
      }
      const response = await activateElection();
      await callCreateVoting(votingEvent, response.nullifiers);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowConfirmModal(false);
      if (error.message === 'tx_canceled') {
        return;
      }
      console.error('Error activating election:', error);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Navegar al dashboard o detalle de la elección
    navigate('/elections');
  };

  const connectMetamask = () => {
    connectWallet();
  }

  const renderButtonText = () => {
    switch (connectionState) {
      case 'disconnected':
        return 'Conectarse a MetaMask para publicar';
      case 'connecting':
        return 'Conectando...';
      case 'notInstalled':
        return 'Instale la extensión MetaMask para publicar';
      case 'connected':
        return 'Confirmar y activar';
      default:
        return 'Conectarse a MetaMask para publicar';
    }
  }

  const isPublishButtonDisabled = () => {
    return !isReadyToPublish || connectionState === 'connecting' || connectionState === 'notInstalled'
  }

  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => navigate('/elections')}
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
            <div className="w-full lg:w-72 order-first lg:order-last">
              {configSummary && <ConfigSummaryCard summary={configSummary} />}
            </div>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Botón volver */}
            <button
              type="button"
              onClick={handleBackToEdit}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver a editar
            </button>

            {/* Botón confirmar */}
            <div className="w-full sm:w-auto text-center sm:text-right">
              <button
                type="button"
                onClick={connectionState === 'disconnected' ? connectMetamask : handleConfirmClick}
                disabled={isPublishButtonDisabled()}
                className={`
                  w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-all
                  ${!isPublishButtonDisabled()
                    ? 'bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                { renderButtonText() }
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Al activar, la votación será visible para votantes según horarios.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmActivateModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleActivate}
        isLoading={activating || transactionState === 'pending'}
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
        isOpen={transactionState == 'canceled'}
        onClose={resetTransactionState}
        title='Operación cancelada'
        type='info'
        showClose
        closeOnEscape
      >
        Operación cancelada por el usuario. No se ha publicado la votación.
      </Modal2>

      <Modal2
        isOpen={transactionState == 'error'}
        onClose={resetTransactionState}
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
