import { useRef, useState } from "react";
import Modal2 from "@/components/Modal2";
import { useEstimateMyTvdCapacityMutation } from "@/store/tvd";
import type { TvdEstimatedCapacityResponse } from "@/store/tvd";
import {
  formatTvdCapacityAmount,
  getCapacityRequestErrorMessage,
  validateEstimatedParticipants,
} from "../utils/tvdCapacityUi";

interface EstimateVotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (capacity: TvdEstimatedCapacityResponse) => void;
  onRecharge: (capacity: TvdEstimatedCapacityResponse) => void;
}

export default function EstimateVotersModal({
  isOpen,
  onClose,
  onContinue,
  onRecharge,
}: EstimateVotersModalProps) {
  const [value, setValue] = useState("");
  const latestValueRef = useRef("");
  const submittingRef = useRef(false);
  const [capacity, setCapacity] =
    useState<TvdEstimatedCapacityResponse | null>(null);
  const [estimateCapacity, { isLoading, error }] =
    useEstimateMyTvdCapacityMutation();
  const validation = validateEstimatedParticipants(value);
  const isValid = validation.valid;

  const handleClose = () => {
    setValue("");
    latestValueRef.current = "";
    setCapacity(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!isValid || isLoading || submittingRef.current) return;
    const requestedParticipants = validation.value;
    submittingRef.current = true;

    try {
      const result = await estimateCapacity({
        estimatedParticipants: requestedParticipants,
      }).unwrap();
      const latestValidation = validateEstimatedParticipants(latestValueRef.current);
      if (
        !latestValidation.valid ||
        latestValidation.value !== requestedParticipants
      ) {
        return;
      }
      setCapacity(result);
    } catch {
      setCapacity(null);
    } finally {
      submittingRef.current = false;
    }
  };

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue);
    latestValueRef.current = nextValue;
    setCapacity(null);
  };

  const handleContinue = () => {
    if (!capacity) return;
    setValue("");
    latestValueRef.current = "";
    setCapacity(null);
    onContinue(capacity);
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Estimar participantes"
      type="plain"
      size="sm"
      closeOnEscape
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="estimated-voters"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            ¿Cuántos participantes estima que tendrá esta elección?
          </label>
          <input
            id="estimated-voters"
            value={value}
            onChange={(event) => handleValueChange(event.target.value)}
            inputMode="numeric"
            placeholder="Ej. 5000"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
          />
          {value && !isValid ? (
            <p className="mt-2 text-xs font-medium text-red-600">
              {validation.message}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span>Regla de capacidad</span>
            <strong>1 participante = 1 TVD</strong>
          </div>
          {capacity ? (
            <div className="space-y-2 pt-3">
              <div className="flex items-center justify-between">
                <span>Participantes estimados</span>
                <strong>{capacity.estimatedParticipants}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>TVD requeridos</span>
                <strong>
                  {formatTvdCapacityAmount(capacity.estimatedRequiredTokens)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Saldo validado por backend</span>
                <strong>{formatTvdCapacityAmount(capacity.availableTokens)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Faltante</span>
                <strong>
                  {formatTvdCapacityAmount(capacity.estimatedMissingTokens)}
                </strong>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-3">
              <span>Validación backend</span>
              <strong className="text-slate-500">Pendiente</strong>
            </div>
          )}
        </div>

        {capacity?.hasEstimatedCapacity ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            La wallet tiene capacidad estimada para esta elección.
          </div>
        ) : null}

        {capacity && !capacity.hasEstimatedCapacity ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            El saldo actual no cubre la estimación. Puedes crear el borrador y
            recargar antes de publicar.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getCapacityRequestErrorMessage(error)}
          </div>
        ) : null}

        <p className="text-xs leading-5 text-slate-500">
          Esta estimación es informativa. El padrón real se validará nuevamente
          antes de avanzar a publicación.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          {capacity ? (
            <button
              type="button"
              onClick={handleContinue}
              className="rounded-lg bg-[#459151] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44]"
            >
              {capacity.hasEstimatedCapacity
                ? "Crear borrador"
                : "Crear borrador de todos modos"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!isValid || isLoading}
              className="rounded-lg bg-[#459151] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Validando..." : "Validar capacidad"}
            </button>
          )}
        </div>

        {capacity && !capacity.hasEstimatedCapacity ? (
          <button
            type="button"
            onClick={() => onRecharge(capacity)}
            className="w-full rounded-lg border border-[#459151]/20 bg-[#EFF7F0] px-4 py-3 text-sm font-semibold text-[#2E6A38] transition hover:bg-[#E4F3E7]"
          >
            Ir a recarga operativa
          </button>
        ) : null}
      </div>
    </Modal2>
  );
}
