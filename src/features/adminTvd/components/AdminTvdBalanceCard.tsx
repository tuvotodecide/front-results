import { BanknotesIcon } from "@heroicons/react/24/outline";
import type { InstitutionTvdBalance } from "../types";

interface AdminTvdBalanceCardProps {
  balance: InstitutionTvdBalance;
  onClick: () => void;
}

export default function AdminTvdBalanceCard({
  balance,
  onClick,
}: AdminTvdBalanceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[96px] w-full items-center justify-between rounded-2xl border border-amber-300 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
      aria-label="Ir a recarga operativa"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          SALDO $TVD
        </p>
        <p className="mt-2 text-4xl font-bold text-slate-900">
          {balance.amount.toLocaleString("es-BO")}
        </p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-100">
        <BanknotesIcon className="h-5 w-5" />
      </span>
    </button>
  );
}
