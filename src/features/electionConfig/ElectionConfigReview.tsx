// Página de revisión final antes de publicar la elección
// Basado en capturas 01-04

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PhoneMockup from './components/PhoneMockup';
import BallotPreview from './components/BallotPreview';
import ConfigSummaryCard from './components/ConfigSummaryCard';
import ConfirmActivateModal from './components/ConfirmActivateModal';
import ActivatedSuccessModal from './components/ActivatedSuccessModal';
import { useElectionPublish } from './data/useElectionPublish';

const ElectionConfigReview: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || 'demo-election';

  const {
    ballotPreview,
    configSummary,
    loading,
    activateElection,
    activating,
    activationResult,
    copyToClipboard,
  } = useElectionPublish(actualElectionId);

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
      await activateElection();
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error activating election:', error);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Navegar al dashboard o detalle de la elección
    navigate('/elections');
  };

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
                onClick={handleConfirmClick}
                disabled={!isReadyToPublish}
                className={`
                  w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-all
                  ${isReadyToPublish
                    ? 'bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Confirmar y activar
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
    </div>
  );
};

export default ElectionConfigReview;
