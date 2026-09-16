// Popover "¿Qué son los TVD?" con el mismo estilo que InfoPopover de cargos.

import React, { useEffect, useRef, useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TvdInfoPopoverProps {
  className?: string;
}

const TvdInfoPopover: React.FC<TvdInfoPopoverProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    // Puede vivir dentro de una tarjeta clickeable: los eventos no deben
    // propagarse hasta ella para no navegar al abrir o leer el popover.
    <div
      ref={containerRef}
      className={`relative inline-flex ${className}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        // stopPropagation también impide que el listener de document vea
        // Escape cuando el foco está dentro del popover.
        if (event.key === 'Escape') setIsOpen(false);
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
          isOpen ? 'text-[#2E6A38]' : 'text-[#2E6A38]/60 hover:text-[#2E6A38]'
        }`}
        aria-label="¿Qué son los TVD?"
        aria-expanded={isOpen}
      >
        <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="¿Qué son los TVD?"
          className="absolute left-0 top-full z-50 mt-2 w-72 cursor-default sm:w-80"
        >
          <div className="rounded-lg border border-[#c3e6cb] bg-[#d4edda] p-4 text-left shadow-lg">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold normal-case tracking-normal text-gray-800">
                ¿Qué son los TVD?
              </h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm font-normal normal-case tracking-normal text-gray-700">
              Los tokens TVD son créditos utilizados para crear tus propias votaciones. La
              cantidad de TVD consumida depende de cuántas personas participen: si planeas una
              votación para 100 personas y cada voto consume 1 TVD, se te solicitarán 100 TVD
              para publicar la votación. Si al final participan 70 personas, se te devolverán
              30 TVD por las personas que no participaron cuando termine la votación.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TvdInfoPopover;
