import { useMemo, useState } from "react";
import Modal2 from "@/components/Modal2";
import { estimateTvdConsumption } from "../services/adminTvdBalanceApi";

interface EstimateVotersModalProps {
  isOpen: boolean;
  availableBalance: number;
  onClose: () => void;
  onContinue: (totalEstimated: number) => void;
  onInsufficientBalance: (totalEstimated: number) => void;
}

const parseVoters = (value: string) => {
  if (!/^\d+$/.test(value.trim())) return NaN;
  return Number(value);
};

export default function EstimateVotersModal({
  isOpen,
  availableBalance,
  onClose,
  onContinue,
  onInsufficientBalance,
}: EstimateVotersModalProps) {
  const [value, setValue] = useState("");
  const voters = parseVoters(value);
  const estimate = useMemo(
    () => estimateTvdConsumption(Number.isFinite(voters) ? voters : 0),
    [voters],
  );
  const isValid = Number.isFinite(voters) && voters > 0;

  const handleClose = () => {
    setValue("");
    onClose();
  };

  const handleContinue = () => {
    if (!isValid) return;

    if (availableBalance >= estimate.total) {
      setValue("");
      onContinue(estimate.total);
      return;
    }

    setValue("");
    onInsufficientBalance(estimate.total);
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Estimar empadronados"
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
            Cantidad estimada de votantes
          </label>
          <input
            id="estimated-voters"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="numeric"
            placeholder="Ej. 5000"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
          />
          {value && !isValid ? (
            <p className="mt-2 text-xs font-medium text-red-600">
              Ingresa una cantidad mayor a cero.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span>Consumo por voto válido</span>
            <strong>1 $TVD</strong>
          </div>
          <div className="flex items-center justify-between pt-3">
            <span>Total estimado</span>
            <strong className="text-[#2E6A38]">
              {isValid ? `${estimate.total.toLocaleString("es-BO")} $TVD` : "-"}
            </strong>
          </div>
        </div>

        <p className="text-xs leading-5 text-slate-500">
          Esta es una estimación. La validación final se realizará antes de
          publicar.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!isValid}
            className="rounded-lg bg-[#459151] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </div>
    </Modal2>
  );
}
