// Modal para corregir registros inválidos del padrón
// Basado en capturas 04_fix_invalid_modal.png y 05_fix_invalid_modal_alt.png

import React, { useEffect, useState } from 'react';
import Modal2 from '../../../components/Modal2';
import type { CorrectionInput, InvalidReason, Voter } from '../types';

interface FixInvalidModalProps {
  isOpen: boolean;
  onClose: () => void;
  invalidVoters: Voter[];
  onSave: (corrections: CorrectionInput[]) => Promise<void>;
  onDelete: (voterId: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

interface EditableVoter extends Voter {
  editedCarnet: string;
  editedEnabled: boolean;
  isValidated: boolean;
  currentReason?: InvalidReason;
}

const BOLIVIAN_CARNET_REGEX = /^\d{5,10}[A-Z]{0,2}$/;

const normalizeCarnet = (carnet: string): string =>
  String(carnet || '')
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, '');

const getValidationReason = (carnet: string): InvalidReason | undefined => {
  const cleaned = normalizeCarnet(carnet);
  if (!cleaned) return 'empty';
  if (!BOLIVIAN_CARNET_REGEX.test(cleaned)) return 'invalid_format';
  return undefined;
};

const buildEditableVoters = (voters: Array<Voter | EditableVoter>): EditableVoter[] => {
  const counts = new Map<string, number>();

  voters.forEach((voter) => {
    const editedCarnet = 'editedCarnet' in voter ? voter.editedCarnet : voter.carnet;
    const normalized = normalizeCarnet(editedCarnet);
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  return voters.map((voter) => {
    const editedCarnet = 'editedCarnet' in voter ? voter.editedCarnet : voter.carnet;
    const normalized = normalizeCarnet(editedCarnet);
    const inheritedReason = 'editedEnabled' in voter ? undefined : voter.invalidReason;
    let currentReason = getValidationReason(editedCarnet) ?? inheritedReason;

    if (!currentReason && normalized && (counts.get(normalized) ?? 0) > 1) {
      currentReason = 'duplicate';
    }

    return {
      ...voter,
      editedCarnet,
      editedEnabled: 'editedEnabled' in voter ? voter.editedEnabled : voter.enabled,
      currentReason,
      isValidated: !currentReason,
    };
  });
};

const getReasonLabel = (reason?: InvalidReason): string => {
  switch (reason) {
    case 'empty':
      return 'Vacío';
    case 'invalid_format':
      return 'Formato inválido';
    case 'duplicate':
      return 'Duplicado';
    case 'invalid_enabled':
      return 'Habilitación inválida';
    default:
      return 'Error';
  }
};

const getReasonBadgeClass = (reason?: InvalidReason, isValidated?: boolean): string => {
  if (isValidated) {
    return 'bg-[#459151] text-white';
  }
  if (reason === 'empty') {
    return 'bg-gray-200 text-gray-600';
  }
  return 'bg-red-500 text-white';
};

const FixInvalidModal: React.FC<FixInvalidModalProps> = ({
  isOpen,
  onClose,
  invalidVoters,
  onSave,
  onDelete,
  isLoading,
  error,
}) => {
  const [editableVoters, setEditableVoters] = useState<EditableVoter[]>([]);
  const hasPendingErrors = editableVoters.some((voter) => !voter.isValidated);

  useEffect(() => {
    if (isOpen) {
      setEditableVoters(buildEditableVoters(invalidVoters));
    }
  }, [invalidVoters, isOpen]);

  const handleCarnetChange = (voterId: string, value: string) => {
    setEditableVoters((prev) =>
      buildEditableVoters(
        prev.map((voter) =>
          voter.id === voterId
            ? {
                ...voter,
                editedCarnet: value,
              }
            : voter,
        ),
      ),
    );
  };

  const handleEnabledChange = (voterId: string, value: boolean) => {
    setEditableVoters((prev) =>
      buildEditableVoters(
        prev.map((voter) =>
          voter.id === voterId
            ? {
                ...voter,
                editedEnabled: value,
              }
            : voter,
        ),
      ),
    );
  };

  const handleDelete = async (voterId: string) => {
    await onDelete(voterId);
    setEditableVoters((prev) => buildEditableVoters(prev.filter((voter) => voter.id !== voterId)));
  };

  const handleSave = async () => {
    if (hasPendingErrors) {
      return;
    }

    const corrections: CorrectionInput[] = editableVoters
      .filter(
        (voter) =>
          normalizeCarnet(voter.editedCarnet) !== normalizeCarnet(voter.carnet) ||
          voter.editedEnabled !== voter.enabled,
      )
      .map((voter) => ({
        id: voter.id,
        carnet: normalizeCarnet(voter.editedCarnet),
        enabled: voter.editedEnabled,
      }));

    await onSave(corrections);
  };

  const handleDownloadCSV = () => {
    const headers = ['Fila', 'Carnet', 'Habilitado', 'Motivo del Error'];
    const rows = editableVoters.map((voter) => [
      voter.rowNumber.toString(),
      voter.carnet,
      voter.editedEnabled ? 'SI' : 'NO',
      getReasonLabel(voter.currentReason),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'errores_padron.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title="Corregir registros inválidos"
      size="2xl"
      className="max-w-5xl"
      type="plain"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-500 -mt-2">
          Corrige o elimina registros con errores antes de publicar la votación.
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-gray-700 font-medium">
              {editableVoters.length} registros inválidos
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar errores
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || hasPendingErrors}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Guardar correcciones
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El carnet debe tener solo numeros y, si aplica, letras solo al final. Ejemplo:
          <span className="font-medium"> 12345678</span> o
          <span className="font-medium"> 12345678LP</span>.
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 w-20">Fila #</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Carnet</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 w-40">Habilitado</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 w-44">Motivo del error</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 w-20">Acción</th>
                </tr>
              </thead>
              <tbody>
                {editableVoters.map((voter) => (
                  <tr key={voter.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 text-gray-500">#{voter.rowNumber}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={voter.editedCarnet}
                        onChange={(e) => handleCarnetChange(voter.id, e.target.value)}
                        placeholder="Ingresa carnet válido"
                        disabled={isLoading}
                        className={`
                          w-full px-4 py-2 border rounded-lg
                          focus:ring-2 focus:ring-[#459151] focus:border-[#459151]
                          transition-colors
                          ${voter.isValidated ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}
                          disabled:opacity-50
                        `}
                      />
                      {!voter.isValidated && (
                        <p className="mt-1 text-xs text-red-600">
                          {voter.currentReason === 'empty' && 'El carnet es obligatorio.'}
                          {voter.currentReason === 'invalid_format' &&
                            'Formato inválido: usa números y, si aplica, letras solo al final.'}
                          {voter.currentReason === 'duplicate' &&
                            'Este carnet está repetido en el padrón.'}
                          {voter.currentReason === 'invalid_enabled' &&
                            'Selecciona si el registro está habilitado o no.'}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={voter.editedEnabled ? 'si' : 'no'}
                        onChange={(e) => handleEnabledChange(voter.id, e.target.value === 'si')}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#459151] focus:border-[#459151] disabled:opacity-50"
                      >
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`
                          inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                          ${getReasonBadgeClass(voter.currentReason, voter.isValidated)}
                        `}
                      >
                        {voter.isValidated ? (
                          <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Validado
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                            </svg>
                            {getReasonLabel(voter.currentReason)}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(voter.id)}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Eliminar registro"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          Las correcciones recalcularán los totales antes de subir la nueva versión del padrón.
        </div>
      </div>
    </Modal2>
  );
};

export default FixInvalidModal;
