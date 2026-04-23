// Popover de información "¿Qué son los cargos?"
// Basado en captura 02_info_popover.png

import React, { useState, useRef, useEffect } from 'react';

interface InfoPopoverProps {
  className?: string;
  isReferendum?: boolean;
}

const InfoPopover: React.FC<InfoPopoverProps> = ({ className = '', isReferendum = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Botón info */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
          transition-colors
          ${isOpen ? 'bg-[#459151] text-white' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}
        `}
        aria-label={isReferendum ? 'Información sobre la consulta' : 'Información sobre cargos'}
      >
        i
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80"
        >
          <div className="bg-[#d4edda] border border-[#c3e6cb] rounded-lg shadow-lg p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-800">
                {isReferendum ? '¿Cómo se organiza la consulta?' : '¿Qué son los cargos?'}
              </h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            {isReferendum ? (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  En un referéndum no necesitas configurar cargos. La consulta ya queda lista para que
                  después agregues sus opciones y definas cómo se verán en la papeleta.
                </p>
                <p className="text-sm font-medium text-gray-800 mb-2">Qué sigue:</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Crear las opciones de la consulta</li>
                  <li>Completar la respuesta visible para cada opción</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  Los cargos son las posiciones que se eligen en la votación (ej.: Presidente, Vicepresidente).
                  Cada cargo define qué verá el votante en la boleta y cuántas opciones puede elegir.
                </p>
                <p className="text-sm font-medium text-gray-800 mb-2">Ejemplos:</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Presidente (elige 1)</li>
                  <li>Vicepresidente (elige 1)</li>
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPopover;
