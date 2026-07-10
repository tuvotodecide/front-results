interface AdminTvdStepperProps {
  currentStep: 1 | 2 | 3;
}

const steps = ["Confirmar Monto", "Escanear QR", "Confirmación"] as const;

export default function AdminTvdStepper({ currentStep }: AdminTvdStepperProps) {
  return (
    <ol className="grid grid-cols-3 items-start gap-2 text-center">
      {steps.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3;
        const active = currentStep === step;
        const complete = currentStep > step;
        return (
          <li key={label} className="relative flex flex-col items-center gap-2">
            {index > 0 ? (
              <span className="absolute right-1/2 top-4 h-px w-full -translate-x-5 bg-slate-200" />
            ) : null}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
                complete || active
                  ? "border-[#459151] bg-[#EFF7F0] text-[#2E6A38]"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              {complete ? "✓" : step}
            </span>
            <span
              className={`text-[11px] font-medium sm:text-xs ${
                complete || active ? "text-[#2E6A38]" : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
