// Tabla expandible de partidos/planchas
// Basado en captura 04_table_expanded.png

import React, { useState } from 'react';
import type { PartyWithCandidates } from '../types';
import { getOptionColors } from '../renderUtils';

interface PartiesTableProps {
  parties: PartyWithCandidates[];
  onEdit?: (party: PartyWithCandidates) => void;
  onDelete?: (party: PartyWithCandidates) => void;
  onEditCandidates?: (party: PartyWithCandidates) => void;
  loading?: boolean;
  readOnly?: boolean;
  isReferendum?: boolean;
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PartiesTable: React.FC<PartiesTableProps> = ({
  parties,
  onEdit,
  onDelete,
  onEditCandidates,
  loading = false,
  readOnly = false,
  isReferendum = false,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (partyId: string) => {
    if (isReferendum) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(partyId)) {
        next.delete(partyId);
      } else {
        next.add(partyId);
      }
      return next;
    });
  };

  if (parties.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-12 text-center">
          <p className="text-gray-500">
            {isReferendum
              ? 'Agrega las opciones del referéndum para continuar'
              : 'Crear planchas y asignar candidatos para continuar con la creación de votación'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {!isReferendum ? (
              <th className="text-left px-6 py-4 font-semibold text-gray-700 w-12"></th>
            ) : null}
            <th className="text-left px-4 py-4 font-semibold text-gray-700">
              {isReferendum ? 'Opción' : 'Partido'}
            </th>
            {!isReferendum ? (
              <>
                <th className="text-center px-4 py-4 font-semibold text-gray-700 w-24">Color</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-700 w-24">Logo</th>
              </>
            ) : null}
            {!readOnly && (
              <th className="text-right px-6 py-4 font-semibold text-gray-700">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {parties.map((party) => {
            const isExpanded = expandedIds.has(party.id);
            const hasCandidates = party.candidates.length > 0;
            const colors = getOptionColors(party);

            return (
              <React.Fragment key={party.id}>
                {/* Fila principal */}
                <tr
                  className={`border-b border-gray-100 hover:bg-gray-50 ${isReferendum ? '' : 'cursor-pointer'}`}
                  onClick={() => toggleExpand(party.id)}
                >
                  {/* Chevron */}
                  {!isReferendum ? (
                    <td className="px-6 py-4">
                      <ChevronIcon isOpen={isExpanded} />
                    </td>
                  ) : null}

                  {/* Nombre */}
                  <td className="px-4 py-4 font-medium text-gray-800">
                    {party.name}
                  </td>

                  {/* Color */}
                  {!isReferendum ? (
                    <>
                      <td className="px-4 py-4 text-center">
                        <div className="mx-auto flex w-max items-center justify-center gap-1">
                          {colors.map((color, index) => (
                            <span
                              key={`${party.id}-${color}-${index}`}
                              className="h-6 w-6 rounded border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {party.logoUrl ? (
                          <img
                            src={party.logoUrl}
                            alt={party.name}
                            className="w-10 h-10 rounded-full object-cover mx-auto border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
                            <span className="text-gray-400 text-xs">N/A</span>
                          </div>
                        )}
                      </td>
                    </>
                  ) : null}

                  {/* Acciones */}
                  {!readOnly && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit?.(party)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-[#459151] hover:bg-[#3a7a44] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(party)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>

                {/* Fila expandida - Candidatos */}
                {!isReferendum && isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={readOnly ? 4 : 5} className="px-6 py-4">
                      <div className="pl-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-[#459151]">
                            {isReferendum ? 'Respuesta configurada' : 'Candidatos asignados'}
                          </h4>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => onEditCandidates?.(party)}
                              disabled={loading}
                              className="px-4 py-2 bg-[#459151] hover:bg-[#3a7a44] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isReferendum ? 'Editar respuesta' : 'Editar Candidatos'}
                            </button>
                          )}
                        </div>

                        {hasCandidates ? (
                          <div className="space-y-3">
                            {party.candidates.map((candidate) => (
                              <div
                                key={candidate.id}
                                className="flex items-center gap-4"
                              >
                                {/* Foto */}
                                {candidate.photoUrl ? (
                                  <img
                                    src={candidate.photoUrl}
                                    alt={candidate.fullName}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                  </div>
                                )}

                                {/* Cargo y nombre */}
                                <div>
                                  <span className="text-gray-500 text-sm">
                                    {candidate.positionName}:
                                  </span>
                                  <span className="ml-2 font-medium text-gray-800">
                                    {candidate.fullName}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">
                            {isReferendum
                              ? 'No hay respuesta configurada. Haz clic en "Editar respuesta" para agregarla.'
                              : 'No hay candidatos asignados. Haz clic en "Editar Candidatos" para agregar.'}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PartiesTable;
