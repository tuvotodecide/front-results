import React from "react";
import Modal2 from "../../../components/Modal2";
import type { PadronImportError } from "../../../store/votingEvents";

interface PadronObservationsModalProps {
  isOpen: boolean;
  errors: PadronImportError[];
  onClose: () => void;
  onAddRecord?: () => void;
}

const PadronObservationsModal: React.FC<PadronObservationsModalProps> = ({
  isOpen,
  errors,
  onClose,
  onAddRecord,
}) => {
  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title="Observaciones del procesamiento"
      size="2xl"
      type="plain"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Estas observaciones vienen del parser del backend. Los registros observados no quedan listos en el staging hasta que los corrijas manualmente.
        </div>

        {errors.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No hay observaciones registradas para este import.
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Fila
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Mensaje
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Valor detectado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {errors.map((error, index) => (
                  <tr key={`${error.code}-${error.rowIndex ?? "na"}-${index}`}>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {error.rowIndex ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      {error.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {error.message}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {error.rawValue || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cerrar
          </button>
          {onAddRecord ? (
            <button
              type="button"
              onClick={onAddRecord}
              className="rounded-xl bg-[#2f8f3a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#277531]"
            >
              Agregar registro manual
            </button>
          ) : null}
        </div>
      </div>
    </Modal2>
  );
};

export default PadronObservationsModal;
