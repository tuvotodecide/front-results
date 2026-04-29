// Modal para consultar estado en el padrón electoral
// Implementa los 3 estados: form inicial, loading, y resultado

import React, { useState, useCallback } from 'react';
import Modal2 from '../../components/Modal2';
import { padronCheckService } from './PadronCheckService.api';
import type { PadronCheckEventResult, PadronCheckResult, PadronStatus } from './types';

interface PadronCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
}

// Icono de búsqueda
const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

// Icono de información
const InfoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// Icono de check
const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Icono de X
const XIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Icono de alerta
const AlertIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Spinner pequeño
const ButtonSpinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// Componente de resultado
const statusLabels: Record<PadronStatus, string> = {
  ELIGIBLE: 'HABILITADO',
  NOT_ELIGIBLE: 'NO HABILITADO',
  DISABLED: 'DESHABILITADO',
  NOT_REGISTERED: 'NO REGISTRADO',
  ROLL_IN_VALIDATION: 'PADRÓN EN VALIDACIÓN',
  PUBLIC_CHECK_DISABLED: 'CONSULTA DESHABILITADA',
};

const EventStatusBadge: React.FC<{ status: PadronCheckEventResult['status'] }> = ({ status }) => {
  const styles: Record<PadronCheckEventResult['status'], string> = {
    ELIGIBLE: 'bg-green-100 text-green-700 border-green-200',
    DISABLED: 'bg-amber-100 text-amber-700 border-amber-200',
    NOT_ELIGIBLE: 'bg-red-100 text-red-600 border-red-200',
    ROLL_IN_VALIDATION: 'bg-amber-100 text-amber-700 border-amber-200',
    PUBLIC_CHECK_DISABLED: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const labels: Record<PadronCheckEventResult['status'], string> = {
    ELIGIBLE: 'HABILITADO',
    DISABLED: 'DESHABILITADO',
    NOT_ELIGIBLE: 'NO HABILITADO',
    ROLL_IN_VALIDATION: 'PADRÓN EN VALIDACIÓN',
    PUBLIC_CHECK_DISABLED: 'CONSULTA DESHABILITADA',
  };

  return (
    <span
      className={`inline-flex max-w-full items-center justify-center rounded-full border px-3 py-1 text-center text-[11px] font-semibold leading-tight whitespace-normal break-words sm:text-xs ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

const phaseLabels: Record<PadronCheckEventResult['phase'], string> = {
  UPCOMING: 'PRÓXIMA',
  ACTIVE: 'ACTIVA',
  RESULTS: 'RESULTADOS',
  OTHER: 'OTRA',
};

const ResultCard: React.FC<{ result: Extract<PadronCheckResult, { kind: 'single' }> }> = ({ result }) => {
  if (result.status === 'ELIGIBLE') {
    return (
      <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-green-800">HABILITADO</h4>
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">
                VERIFICADO
              </span>
            </div>
            <p className="text-green-700 mb-3">
              Estás habilitado para votar en este evento electoral.
            </p>
            {result.mesaAsignada && (
              <p className="text-sm text-green-600">
                <span className="font-medium">Mesa asignada:</span> {result.mesaAsignada}
              </p>
            )}
          </div>
        </div>

      </div>
    );
  }

  if (result.status === 'NOT_ELIGIBLE') {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <XIcon className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-red-800">NO HABILITADO</h4>
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">
                VERIFICADO
              </span>
            </div>
            <p className="text-red-700">
              No estás habilitado para votar en este evento electoral.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'DISABLED') {
    return (
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-amber-800">DESHABILITADO</h4>
              <span className="px-2 py-0.5 bg-amber-600 text-white text-xs font-semibold rounded-full">
                VERIFICADO
              </span>
            </div>
            <p className="text-amber-700">
              Tu carnet está en el padrón, pero tu participación está deshabilitada para este evento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'ROLL_IN_VALIDATION') {
    return (
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-amber-800 mb-1">
              {statusLabels[result.status]}
            </h4>
            <p className="text-amber-700">
              El padrón aún está en validación. Intenta nuevamente más tarde.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'PUBLIC_CHECK_DISABLED') {
    return (
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <InfoIcon className="w-6 h-6 text-gray-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-800 mb-1">
              {statusLabels[result.status]}
            </h4>
            <p className="text-gray-600">
              Esta institución deshabilitó la consulta pública del padrón.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // NOT_REGISTERED
  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertIcon className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-amber-800 mb-1">NO REGISTRADO</h4>
          <p className="text-amber-700">
            No encontramos tu carnet en el padrón electoral de este evento.
          </p>
        </div>
      </div>
    </div>
  );
};

const PadronCheckModal: React.FC<PadronCheckModalProps> = ({ isOpen, onClose, eventId }) => {
  const [carnet, setCarnet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PadronCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validación: carnet boliviano con números y opcionalmente letras al final
  const isValidCarnet = (value: string): boolean => {
    const cleaned = value
      .trim()
      .toUpperCase()
      .replace(/[\s.-]/g, '');
    return /^\d{5,10}[A-Z]{0,2}$/.test(cleaned);
  };

  const canSubmit = carnet.trim().length > 0 && !isLoading;
  const hasValidationError = carnet.trim().length > 0 && !isValidCarnet(carnet);

  const handleVerify = useCallback(async () => {
    if (!isValidCarnet(carnet)) {
      setError('El carnet debe contener al menos 7 dígitos numéricos.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const checkResult = await padronCheckService.checkStatus(carnet, eventId);
      setResult(checkResult);
    } catch (_err) {
      setError('Error al verificar. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [carnet]);

  const handleClose = () => {
    // Reset state on close
    setCarnet('');
    setResult(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir dígitos
    const value = e.target.value.replace(/\D/g, '');
    setCarnet(value);
    // Limpiar error y resultado al cambiar input
    if (error) setError(null);
    if (result) setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit && isValidCarnet(carnet)) {
      handleVerify();
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Consulta tu estado en el Padrón"
      size="lg"
      type="plain"
      className="max-h-[min(88vh,42rem)]"
    >
      <div className="space-y-4 sm:space-y-5">
        {/* Texto guía */}
        <p className="mx-auto max-w-2xl text-center text-sm leading-6 text-gray-600 sm:text-[15px]">
          Ingresa tu número de Carnet de Identidad para verificar si estás habilitado
          para votar.
        </p>

        {/* Campo de entrada */}
        <div>
          <label htmlFor="carnet-input" className="mb-2 block text-sm font-medium text-gray-700">
            Carnet de Identidad
          </label>
          <div className="relative">
            <input
              id="carnet-input"
              type="text"
              inputMode="numeric"
              placeholder="Ej: 12345678"
              value={carnet}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className={`w-full rounded-xl border px-4 py-3 pr-12 text-gray-900 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${hasValidationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
              `}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon className="h-5 w-5" />
            </div>
          </div>
          {hasValidationError && (
            <p className="mt-1.5 text-sm text-red-600">
              El carnet debe contener entre 7 y 10 dígitos numéricos.
            </p>
          )}
        </div>

        {/* Botón verificar */}
        <button
          onClick={handleVerify}
          disabled={!canSubmit || hasValidationError}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition-all duration-200
            ${canSubmit && !hasValidationError
              ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg'
              : 'cursor-not-allowed bg-gray-200 text-gray-500'
            }
          `}
        >
          {isLoading ? (
            <>
              <ButtonSpinner />
              <span>Verificando...</span>
            </>
          ) : (
            <>
              <SearchIcon className="h-5 w-5" />
              <span>Verificar</span>
            </>
          )}
        </button>

        {/* Error de API */}
        {error && !hasValidationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Resultado */}
        {result?.kind === 'single' && <ResultCard result={result} />}
        {result?.kind === 'multi' && (
          <div className="space-y-3 pt-1">
            {result.events.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-gray-600">
                No hay eventos visibles para este carnet.
              </div>
            ) : (
              result.events.map((event) => (
                <div
                  key={event.eventId}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5 text-gray-800 sm:text-base sm:truncate">
                      {event.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Estado: {phaseLabels[event.phase]}
                    </p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <EventStatusBadge status={event.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Nota importante - solo mostrar si no hay resultado */}
        {!result && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <InfoIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-700">
                  <strong>Importante:</strong> Esta consulta es pública y gratuita.
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Los datos del padrón electoral están protegidos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal2>
  );
};

export default PadronCheckModal;
