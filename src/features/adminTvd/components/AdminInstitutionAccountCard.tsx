import { IdentificationIcon } from "@heroicons/react/24/outline";

interface AdminInstitutionAccountCardProps {
  onClick: () => void;
}

export default function AdminInstitutionAccountCard({
  onClick,
}: AdminInstitutionAccountCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[96px] w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#459151]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#459151]/25"
      aria-label="Ir a cuenta institucional"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Cuenta
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          Cuentas institucionales
        </p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF7F0] text-[#2E6A38] transition group-hover:bg-[#DCEEDF]">
        <IdentificationIcon className="h-5 w-5" />
      </span>
    </button>
  );
}
