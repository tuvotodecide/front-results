// Vista del padrón cargado con stats, tabla y paginación
// Basado en capturas 07_loaded_table_top.png, 08_loaded_file_footer.png, 09_loaded_with_fix_button.png

import React, { useState } from 'react';
import type { Voter, PadronFile } from '../types';

interface LoadedPadronViewProps {
  file: PadronFile;
  voters: Voter[];
  totalVoters: number;
  validCount: number;
  invalidCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onFixInvalid?: () => void;
  onReplaceFile?: () => void;
  onDeleteFile?: () => void;
  onDownloadCsv?: () => void;
  onFinish?: () => void;
  loading?: boolean;
  downloading?: boolean;
  readOnly?: boolean;
}

// Iconos
const InfoIcon = () => (
  <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#459151" />
    <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#dc2626" />
    <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-10 h-10 text-[#459151]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="4" width="24" height="32" rx="2" />
    <path d="M22 4v8h8" strokeLinejoin="round" />
    <path d="M22 4l8 8" strokeLinejoin="round" />
    <line x1="14" y1="20" x2="26" y2="20" strokeLinecap="round" />
    <line x1="14" y1="26" x2="26" y2="26" strokeLinecap="round" />
  </svg>
);

const LoadedPadronView: React.FC<LoadedPadronViewProps> = ({
  file,
  voters,
  totalVoters,
  validCount,
  invalidCount,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onSearchChange,
  onFixInvalid,
  onReplaceFile,
  onDeleteFile,
  onDownloadCsv,
  onFinish,
  loading = false,
  downloading = false,
  readOnly = false,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const formatNumber = (num: number) => num.toLocaleString('es-ES');
  const totalRecords = validCount + invalidCount;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchValue);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Hoy ${time}` : date.toLocaleDateString('es-ES') + ' ' + time;
  };

  // Generar números de página
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (page > 4) pages.push('...');
      if (page > 3 && page < totalPages - 2) pages.push(page);
      if (page < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Registros */}
        <div className="border-2 border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <InfoIcon />
            <span className="font-semibold text-gray-700">Total Registros</span>
          </div>
          <p className="text-4xl font-bold text-gray-800">{formatNumber(totalRecords)}</p>
        </div>

        {/* Válidos */}
        <div className="border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckIcon />
            <span className="font-semibold text-gray-700">Válidos</span>
          </div>
          <p className="text-4xl font-bold text-[#459151]">{formatNumber(validCount)}</p>
          <p className="text-sm text-[#459151] mt-1">Registros habilitados para votar</p>
        </div>

        {/* Inválidos */}
        <div className="border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ErrorIcon />
            <span className="font-semibold text-gray-700">Inválidos</span>
          </div>
          <p className="text-4xl font-bold text-red-600">{formatNumber(invalidCount)}</p>
          <p className="text-sm text-red-600 mt-1">Errores de formato o datos</p>
          {invalidCount > 0 && !readOnly && (
            <button
              type="button"
              onClick={onFixInvalid}
              className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Corregir inválidos
            </button>
          )}
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header de tabla */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Registros cargados</h3>

            <div className="flex items-center gap-4">
              {/* Búsqueda */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Buscar por carnet o nombre"
                  className="w-64 pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#459151] focus:border-[#459151]"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {/* Descargar CSV */}
              <button
                type="button"
                onClick={onDownloadCsv}
                disabled={!onDownloadCsv || downloading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {downloading ? 'Descargando...' : 'Descargar CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
            <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Carnet</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Nombre</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Habilitado</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-gray-500">Cargando...</p>
                </td>
              </tr>
            ) : voters.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              voters.map((voter) => (
                <tr key={voter.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-700">{voter.carnet || 'Sin cédula'}</td>
                  <td className="px-6 py-4 text-gray-600">{voter.fullName || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        voter.enabled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {voter.enabled ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {voter.status === 'valid' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-[#459151] rounded-full text-sm font-medium">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Válido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
                        </svg>
                        Inválido
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {Math.min((page - 1) * pageSize + 1, totalVoters)} - {Math.min(page * pageSize, totalVoters)} de{' '}
              {formatNumber(totalVoters)} registros
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {getPageNumbers().map((p, idx) =>
                typeof p === 'number' ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`
                      w-10 h-10 rounded-lg font-medium transition-colors
                      ${p === page
                        ? 'bg-[#459151] text-white'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={idx} className="px-2 text-gray-400">
                    ...
                  </span>
                )
              )}

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File info card */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DocumentIcon />
          <div>
            <p className="font-semibold text-gray-800">{file.fileName}</p>
            <p className="text-sm text-gray-500">Cargado: {formatDate(file.uploadedAt)}</p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReplaceFile}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reemplazar archivo
            </button>

            <button
              type="button"
              onClick={onDeleteFile}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Botón finalizar */}
      {!readOnly && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onFinish}
            disabled={invalidCount > 0}
            className={`
              inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-all
              ${invalidCount === 0
                ? 'bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Finalizar configuración
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadedPadronView;
