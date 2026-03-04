// Página de configuración de elección - Paso 3: Padrón Electoral
// Basado en capturas 01-09

import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal2 from '../../components/Modal2';
import ConfigStepsTabs from './components/ConfigStepsTabs';
import PadronDropzone from './components/PadronDropzone';
import UploadProgressModal from './components/UploadProgressModal';
import UploadSummaryModal from './components/UploadSummaryModal';
import FixInvalidModal from './components/FixInvalidModal';
import LoadedPadronView from './components/LoadedPadronView';
import { usePadron } from './data/usePadronRepository';
import { useParties } from './data/usePartyRepository';
import { usePositions } from './data/usePositionRepository';
import type { Voter, CorrectionInput, PadronUploadResult, ConfigStep } from './types';

// Mock: obtener título de elección
const getElectionTitle = (electionId: string): string => {
  try {
    const stored = localStorage.getItem('mock_elections');
    if (stored) {
      const elections = JSON.parse(stored);
      const election = elections.find((e: { id: string }) => e.id === electionId);
      if (election) return election.institution;
    }
  } catch {}
  return 'Elecciones Universitarias';
};

type ModalState = 'none' | 'uploading' | 'summary' | 'fixing' | 'revalidating' | 'deleteConfirm';

const ElectionConfigPadron: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || 'demo-election';
  const electionTitle = getElectionTitle(actualElectionId);

  // Ref para input de reemplazo de archivo
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Hook del padrón
  const {
    file,
    isLoaded,
    loading,
    voters,
    totalVoters,
    validCount,
    invalidCount,
    page,
    pageSize,
    totalPages,
    uploadCSV,
    getInvalidVoters,
    saveCorrections,
    deleteVoter,
    deletePadron,
    replacePadron,
    setPage,
    setSearch,
  } = usePadron(actualElectionId);
  const { positions } = usePositions(actualElectionId);
  const { parties } = useParties(actualElectionId);
  const hasPositions = positions.length > 0;
  const hasPartiesWithCandidates = parties.some((party) => party.candidates.length > 0);
  const isPadronReady = isLoaded && validCount > 0 && invalidCount === 0;

  // Estados de UI
  const [modalState, setModalState] = useState<ModalState>('none');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<PadronUploadResult | null>(null);
  const [invalidVoters, setInvalidVoters] = useState<Voter[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Handlers
  const handleFileSelect = async (selectedFile: File) => {
    setPendingFile(selectedFile);
    setModalState('uploading');
    setUploadProgress(0);

    try {
      const result = await uploadCSV(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      setUploadResult(result);
      setModalState('summary');
    } catch (error) {
      console.error('Error uploading file:', error);
      setModalState('none');
    }
  };

  const handleContinueFromSummary = () => {
    setModalState('none');
    setUploadResult(null);
  };

  const handleOpenFixModal = async () => {
    const invalids = await getInvalidVoters();
    setInvalidVoters(invalids);
    setModalState('fixing');
  };

  const handleSaveCorrections = async (corrections: CorrectionInput[]) => {
    setModalState('revalidating');
    setUploadProgress(0);

    try {
      const result = await saveCorrections(corrections, (progress) => {
        setUploadProgress(progress);
      });
      setUploadResult(result);

      if (result.invalidCount > 0) {
        // Aún hay inválidos, mostrar resumen
        setModalState('summary');
      } else {
        // Todo corregido
        setModalState('none');
      }
    } catch (error) {
      console.error('Error saving corrections:', error);
      setModalState('fixing');
    }
  };

  const handleDeleteVoter = async (voterId: string) => {
    await deleteVoter(voterId);
    // Actualizar lista de inválidos
    const invalids = await getInvalidVoters();
    setInvalidVoters(invalids);
  };

  const handleReplaceFile = () => {
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setPendingFile(selectedFile);
    setModalState('uploading');
    setUploadProgress(0);

    try {
      const result = await replacePadron(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      setUploadResult(result);
      setModalState('summary');
    } catch (error) {
      console.error('Error replacing file:', error);
      setModalState('none');
    }

    e.target.value = '';
  };

  const handleDeleteFile = () => {
    setModalState('deleteConfirm');
  };

  const handleConfirmDelete = async () => {
    await deletePadron();
    setModalState('none');
  };

  const handleFinish = () => {
    // Navegar a pantalla de revisión final antes de publicar
    navigate(`/elections/${actualElectionId}/config/review`);
  };

  const handleGoToStep = (step: ConfigStep) => {
    if (step === 1) {
      navigate(`/elections/${actualElectionId}/config/cargos`);
    } else if (step === 2) {
      navigate(`/elections/${actualElectionId}/config/planchas`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      {/* Contenido principal */}
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Título */}
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            {electionTitle}
          </h1>

          {/* Tabs - Pasos 1 y 2 completados, Paso 3 activo */}
          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={3}
              completedSteps={[
                ...(hasPositions ? [1] : []),
                ...(hasPartiesWithCandidates ? [2] : []),
                ...(isPadronReady ? [3] : []),
              ]}
              onStepChange={handleGoToStep}
              canNavigate={(step) => {
                if (step === 1 || step === 2 || step === 3) return true;
                return false;
              }}
            />
          </div>

          {/* Texto del paso */}
          <p className="text-gray-600 mb-6">Paso 3 de 3: Sube el padrón electoral.</p>

          {/* Contenido según estado */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando...</p>
            </div>
          ) : isLoaded && file ? (
            <LoadedPadronView
              file={file}
              voters={voters}
              totalVoters={totalVoters}
              validCount={validCount}
              invalidCount={invalidCount}
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setPage}
              onSearchChange={setSearch}
              onFixInvalid={handleOpenFixModal}
              onReplaceFile={handleReplaceFile}
              onDeleteFile={handleDeleteFile}
              onFinish={handleFinish}
              loading={loading}
            />
          ) : (
            <PadronDropzone onFileSelect={handleFileSelect} disabled={modalState !== 'none'} />
          )}
        </div>
      </div>

      {/* Input oculto para reemplazo de archivo */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".csv"
        onChange={handleReplaceFileSelect}
        className="hidden"
      />

      {/* Modal de progreso de carga */}
      <UploadProgressModal
        isOpen={modalState === 'uploading'}
        progress={uploadProgress}
        title="Cargando padrón..."
      />

      {/* Modal de progreso de revalidación */}
      <UploadProgressModal
        isOpen={modalState === 'revalidating'}
        progress={uploadProgress}
        title="Actualizando padrón..."
      />

      {/* Modal de resumen */}
      <UploadSummaryModal
        isOpen={modalState === 'summary'}
        onClose={() => setModalState('none')}
        validCount={uploadResult?.validCount || validCount}
        invalidCount={uploadResult?.invalidCount || invalidCount}
        onContinue={handleContinueFromSummary}
        onFix={handleOpenFixModal}
      />

      {/* Modal de corrección de inválidos */}
      <FixInvalidModal
        isOpen={modalState === 'fixing'}
        onClose={() => setModalState('none')}
        invalidVoters={invalidVoters}
        onSave={handleSaveCorrections}
        onDelete={handleDeleteVoter}
        isLoading={false}
      />

      {/* Modal de confirmación de eliminación */}
      <Modal2
        isOpen={modalState === 'deleteConfirm'}
        onClose={() => setModalState('none')}
        title="Eliminar padrón"
        size="sm"
        type="plain"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de eliminar el padrón "{file?.fileName}"?
          </p>
          <p className="text-sm text-gray-500">
            Se eliminarán todos los registros cargados. Tendrás que subir un nuevo archivo.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalState('none')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal2>
    </div>
  );
};

export default ElectionConfigPadron;
