// Tabla de cargos con acciones Editar/Eliminar
// Basado en captura 04_table_with_items.png

import React from 'react';
import type { Position } from '../types';

interface PositionsTableProps {
  positions: Position[];
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  loading?: boolean;
  readOnly?: boolean;
}

const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onEdit,
  onDelete,
  loading = false,
  readOnly = false,
}) => {
  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-12 text-center">
          <p className="text-gray-500">
            Aún no tienes cargos creados. Debes crear al menos uno para continuar con la votación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Cargos</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-6 py-4 font-semibold text-gray-700">
                Título del cargo
              </th>
              {!readOnly && (
                <th className="text-right px-6 py-4 font-semibold text-gray-700">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {positions.map((position, index) => (
              <tr
                key={position.id}
                className={`
                  border-b border-gray-100 last:border-b-0
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                `}
              >
                <td className="px-6 py-4 text-gray-800">
                  {position.name}
                </td>
                {!readOnly && onEdit && onDelete && (
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {/* Botón Editar */}
                      <button
                        type="button"
                        onClick={() => onEdit(position)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#459151] hover:bg-[#3a7a44] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => onDelete(position)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PositionsTable;
