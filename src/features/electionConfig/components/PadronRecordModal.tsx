import React, { useEffect, useState } from "react";
import Modal2 from "../../../components/Modal2";

interface PadronRecordModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialCi?: string;
  initialEnabled?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { ci: string; enabled: boolean }) => Promise<void> | void;
}

const normalizeCarnetInput = (value: string) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^0-9A-Z\s.-]/g, "");

const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => {
      if (!disabled) {
        onChange(!checked);
      }
    }}
    disabled={disabled}
    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
      checked ? "bg-[#2f8f3a]" : "bg-slate-300"
    } ${disabled ? "opacity-50" : ""}`}
    aria-pressed={checked}
  >
    <span
      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-7" : "translate-x-1"
      }`}
    />
  </button>
);

const PadronRecordModal: React.FC<PadronRecordModalProps> = ({
  isOpen,
  mode,
  initialCi = "",
  initialEnabled = true,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [ci, setCi] = useState(initialCi);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCi(initialCi);
    setEnabled(initialEnabled);
    setError(null);
  }, [initialCi, initialEnabled, isOpen]);

  const handleSubmit = async () => {
    const normalized = normalizeCarnetInput(ci).trim();
    if (!normalized) {
      setError("Debes ingresar el carnet de identidad.");
      return;
    }

    try {
      setError(null);
      await onSubmit({ ci: normalized, enabled });
    } catch (submissionError: any) {
      setError(submissionError?.message ?? "No se pudo guardar el registro.");
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Agregar registro al padrón" : "Editar registro del padrón"}
      size="lg"
      type="plain"
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-500">
            {mode === "create"
              ? "Ingresa el carnet de identidad para agregarlo manualmente al staging."
              : "Modifica el carnet o la habilitación del registro seleccionado."}
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Carnet de identidad
          </span>
          <input
            type="text"
            value={ci}
            onChange={(event) => setCi(normalizeCarnetInput(event.target.value))}
            placeholder="Ej: 4567823 LP"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
          />
          <p className="mt-2 text-sm text-slate-500">
            Incluye el código del departamento si aplica: LP, CB, SC, OR, PT, TJ, BE, PD o CH.
          </p>
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Habilitado para votar</p>
              <p className="mt-1 text-sm text-slate-500">
                El registro quedará {enabled ? "habilitado" : "inhabilitado"} en esta versión.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={enabled} onChange={setEnabled} disabled={isLoading} />
              <span className={`text-sm font-semibold ${enabled ? "text-[#2f8f3a]" : "text-slate-500"}`}>
                {enabled ? "Sí" : "No"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {mode === "create"
            ? "El registro se agregará al staging actual y podrás seguir corrigiendo antes de confirmar la versión final."
            : "Los cambios actualizan el staging activo inmediatamente y recalculan los totales del padrón."}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f8f3a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#277531] disabled:opacity-50"
          >
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
              </svg>
            )}
            <span>{mode === "create" ? "Agregar al padrón" : "Guardar cambios"}</span>
          </button>
        </div>
      </div>
    </Modal2>
  );
};

export default PadronRecordModal;
