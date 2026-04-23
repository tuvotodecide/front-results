// Modal para gestionar candidatos de un partido
// Basado en captura 03_candidates_modal.png

import React, { useState, useEffect, useRef } from 'react';
import Modal2 from '../../../components/Modal2';
import type { Position, CandidateInput, Candidate } from '../types';
import { REFERENDUM_OPTION_LABEL } from '../renderUtils';

interface CandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidates: CandidateInput[]) => Promise<void>;
  isLoading: boolean;
  positions: Position[];
  existingCandidates?: Candidate[];
  partyName?: string;
  submitError?: string | null;
  isReferendum?: boolean;
}

interface CandidateFormData {
  positionId: string;
  positionName: string;
  fullName: string;
  photoBase64?: string;
  photoPreview?: string;
}

const MAX_CANDIDATE_IMAGE_SIZE = 512;
const CANDIDATE_IMAGE_QUALITY = 0.82;

const CandidatesModal: React.FC<CandidatesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  positions,
  existingCandidates = [],
  partyName,
  submitError,
  isReferendum = false,
}) => {
  const [candidates, setCandidates] = useState<CandidateFormData[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const hasMissingRequiredFields = candidates.some(
    (candidate) =>
      !candidate.fullName.trim() ||
      !String(candidate.photoBase64 || candidate.photoPreview || '').trim(),
  );

  // Inicializar formulario según positions y candidatos existentes
  useEffect(() => {
    if (isOpen) {
      setShowValidation(false);
      const initialCandidates = positions.map((pos) => {
        const existing = existingCandidates.find(
          (c) => c.positionId === pos.id || c.positionName === pos.name,
        );
        return {
          positionId: pos.id,
          positionName: pos.name,
          fullName: existing?.fullName || '',
          photoBase64: undefined,
          photoPreview: existing?.photoUrl,
        };
      });
      setCandidates(initialCandidates);
    }
  }, [isOpen, positions, existingCandidates]);

  const handleNameChange = (positionId: string, value: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.positionId === positionId ? { ...c, fullName: value } : c
      )
    );
  };

  const handlePhotoSelect = (positionId: string, file: File) => {
    if (!file.type.startsWith('image/')) return;
    void buildCenteredCandidateImage(file).then((base64) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.positionId === positionId
            ? { ...c, photoBase64: base64, photoPreview: base64 }
            : c
        )
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);

    const hasMissingName = candidates.some((c) => !c.fullName.trim());
    const hasMissingPhoto = candidates.some(
      (c) => !String(c.photoBase64 || c.photoPreview || '').trim(),
    );

    if (hasMissingName || hasMissingPhoto) {
      return;
    }

    const candidateInputs: CandidateInput[] = candidates.map((c) => ({
      positionId: c.positionId,
      positionName: c.positionName,
      fullName: c.fullName.trim(),
      photoBase64: c.photoBase64 || c.photoPreview,
    }));

    try {
      await onSave(candidateInputs);
      onClose();
    } catch {
      // Error manejado por el padre
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title={isReferendum ? 'Configurar opciones' : 'Gestión de Candidatos'}
      size="2xl"
      type="plain"
      closeOnEscape={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {partyName && (
          <p className="text-sm text-gray-500 -mt-2">
            {isReferendum ? 'Opción' : 'Partido'}:{' '}
            <span className="font-medium text-gray-700">{partyName}</span>
          </p>
        )}

        {/* Lista de cargos con inputs */}
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div
              key={candidate.positionId}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              {/* Nombre del cargo */}
              <div className="w-32 flex-shrink-0">
                <span className="font-medium text-gray-700">
                  {isReferendum ? REFERENDUM_OPTION_LABEL : candidate.positionName}
                </span>
              </div>

              {/* Input nombre completo */}
              <div className="flex-1">
                <input
                  type="text"
                  value={candidate.fullName}
                  onChange={(e) => handleNameChange(candidate.positionId, e.target.value)}
                  placeholder={isReferendum ? 'Texto de la respuesta' : 'Nombre completo'}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#459151] focus:border-[#459151] transition-colors"
                />
                {showValidation && !candidate.fullName.trim() && (
                  <p className="mt-1 text-xs text-red-600">
                    {isReferendum ? 'La respuesta es obligatoria.' : 'El nombre es obligatorio.'}
                  </p>
                )}
              </div>

              {/* Botón subir foto */}
              <div className="flex-shrink-0">
                <input
                  ref={(el) => { fileInputRefs.current[candidate.positionId] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelect(candidate.positionId, file);
                    e.currentTarget.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRefs.current[candidate.positionId]?.click();
                  }}
                  disabled={isLoading}
                  className="relative w-14 h-14 rounded-full border-2 border-gray-300 hover:border-[#459151] bg-gray-100 overflow-hidden transition-colors group"
                >
                  {candidate.photoPreview ? (
                    <img
                          src={candidate.photoPreview}
                          alt={isReferendum ? 'Imagen de la opción' : 'Foto candidato'}
                          className="w-full h-full object-cover"
                        />
                  ) : (
                    <svg
                      className="w-8 h-8 mx-auto text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  )}
                  {/* Badge + */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#459151] text-white rounded-full flex items-center justify-center text-xs font-bold">
                    +
                  </span>
                </button>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {isReferendum ? 'Subir imagen' : 'Subir Foto'}
                </p>
                {showValidation && !String(candidate.photoBase64 || candidate.photoPreview || '').trim() && (
                  <p className="mt-1 text-xs text-red-600 text-center">
                    {isReferendum ? 'Imagen obligatoria' : 'Foto obligatoria'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {positions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {isReferendum
              ? 'No se pudo cargar la configuración de la consulta. Reintenta antes de continuar.'
              : 'No hay cargos definidos. Primero define los cargos en el Paso 1.'}
          </div>
        )}

        {/* Botón guardar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || positions.length === 0 || hasMissingRequiredFields}
            className="w-full py-4 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-5 w-5 items-center justify-center ${
                isLoading ? 'visible' : 'invisible'
              }`}
            >
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
            <span>{isLoading ? 'Guardando...' : isReferendum ? 'Guardar opciones' : 'Guardar Candidatos'}</span>
          </button>
        </div>
      </form>
    </Modal2>
  );
};

export default CandidatesModal;

function buildCenteredCandidateImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - side) / 2);
        const sy = Math.max(0, (img.height - side) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = MAX_CANDIDATE_IMAGE_SIZE;
        canvas.height = MAX_CANDIDATE_IMAGE_SIZE;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo preparar la imagen'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img,
          sx,
          sy,
          side,
          side,
          0,
          0,
          MAX_CANDIDATE_IMAGE_SIZE,
          MAX_CANDIDATE_IMAGE_SIZE,
        );

        resolve(canvas.toDataURL('image/jpeg', CANDIDATE_IMAGE_QUALITY));
      };

      img.src = String(reader.result || '');
    };

    reader.readAsDataURL(file);
  });
}
