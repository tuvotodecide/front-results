import Modal2 from "@/components/Modal2";
import { ExclamationTriangleIcon, QrCodeIcon } from "@heroicons/react/24/outline";

interface InsufficientTvdBalanceModalProps {
  isOpen: boolean;
  estimatedAmount: number;
  onClose: () => void;
  onRecharge: () => void;
  onSaveDraft: () => void;
}

export default function InsufficientTvdBalanceModal({
  isOpen,
  estimatedAmount,
  onClose,
  onRecharge,
  onSaveDraft,
}: InsufficientTvdBalanceModalProps) {
  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title="Necesitas recargar $TVD"
      type="plain"
      size="sm"
      closeOnEscape
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-900">
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">
                Tu institución no tiene saldo suficiente para publicar esta
                votación.
              </p>
              <p className="mt-1 text-sm">
                Puedes recargar ahora y continuar después con el proceso.
              </p>
              <p className="mt-2 text-xs font-medium">
                Total estimado: {estimatedAmount.toLocaleString("es-BO")} $TVD
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onRecharge}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44]"
          >
            <QrCodeIcon className="h-5 w-5" />
            Recargar mediante QR
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Guardar como borrador
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal2>
  );
}
