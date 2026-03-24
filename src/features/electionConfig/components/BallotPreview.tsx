// Preview de papeleta dentro del phone mockup
// Basado en captura 01_preview.png

import React from 'react';
import type { PartyWithCandidates } from '../types';

interface BallotPreviewProps {
  parties: PartyWithCandidates[];
}

const BallotPreview: React.FC<BallotPreviewProps> = ({ parties }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header de la app */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button className="text-gray-600">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800 flex-1 text-center pr-5">
          Elige a tu Candidato
        </h1>
      </div>

      {/* Subtítulo */}
      <div className="px-4 py-3 bg-gray-50">
        <p className="text-sm text-gray-600 text-center">
          Seleccione al candidato de su preferencia
        </p>
      </div>

      {/* Lista de partidos */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {parties.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay planchas configuradas
          </div>
        ) : (
          parties.map((party) => (
            <div
              key={party.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Header del partido */}
              <div
                className="px-4 py-2 text-white text-sm font-medium text-center"
                style={{ backgroundColor: party.colorHex }}
              >
                {party.name}
              </div>

              {/* Candidatos */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    {/* Foto del candidato principal */}
                    <div className="flex-shrink-0">
                      {party.candidates[0]?.photoUrl ? (
                        <img
                          src={party.candidates[0].photoUrl}
                          alt={party.candidates[0].fullName}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info de candidatos */}
                    <div className="flex-1 min-w-0">
                      {party.candidates.slice(0, 2).map((candidate, idx) => (
                        <div key={candidate.id} className={idx > 0 ? 'mt-1' : ''}>
                          <p className="text-xs text-gray-500">{candidate.positionName}:</p>
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {candidate.fullName}
                          </p>
                        </div>
                      ))}
                      {party.candidates.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Sin candidatos</p>
                      )}
                    </div>
                  </div>

                  {/* Radio button (deshabilitado) */}
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón de selección (deshabilitado) */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          disabled
          className="w-full py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg text-sm uppercase tracking-wide cursor-not-allowed"
        >
          Selecciona un candidato
        </button>
      </div>
    </div>
  );
};

export default BallotPreview;
