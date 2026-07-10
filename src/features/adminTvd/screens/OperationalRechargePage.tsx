"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useSearchParams } from "@/domains/votacion/navigation/compat-private";
import KioskQrSvg from "@/domains/votacion/components/KioskQrSvg";
import AdminTvdStepper from "../components/AdminTvdStepper";
import {
  calculateRechargeBolivianosAmount,
  createRechargeIntent,
  getRechargePackages,
  getRechargeQr,
  verifyRechargePayment,
} from "../services/adminRechargeApi";
import { copyTextToClipboard } from "../services/clipboard";
import type { RechargeIntent, RechargePackage } from "../types";

const parseAmount = (value: string | null) => {
  if (!value) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? String(Math.floor(parsed)) : "";
};

const formatTvdAmount = (value: number) =>
  new Intl.NumberFormat("es-BO").format(value);

export default function OperationalRechargePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(() => parseAmount(searchParams.get("monto")));
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [selectedPackageLabel, setSelectedPackageLabel] = useState("Monto personalizado");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [intent, setIntent] = useState<RechargeIntent | null>(null);
  const [qrPayload, setQrPayload] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void getRechargePackages().then(setPackages);
  }, []);

  const numericAmount = Number(amount);
  const amountIsValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const amountBs = useMemo(
    () =>
      calculateRechargeBolivianosAmount(
        amountIsValid ? numericAmount : 0,
        packages,
      ),
    [amountIsValid, numericAmount, packages],
  );
  const amountHelpMessage = amountIsValid
    ? "El monto se usará para cubrir el consumo operativo de la votación."
    : "Ingresa un monto válido para continuar.";

  const handleSelectPackage = (pkg: RechargePackage) => {
    setAmount(String(pkg.tvdAmount));
    setSelectedPackageLabel(pkg.label);
    setSelectedPackageId(pkg.id);
  };

  const handleContinueToQr = async () => {
    if (!amountIsValid) return;

    const nextIntent = await createRechargeIntent(numericAmount, amountBs);
    const nextQr = await getRechargeQr(nextIntent);
    setIntent(nextIntent);
    setQrPayload(nextQr);
    setStep(2);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setFeedback(null);
    await verifyRechargePayment();
    setVerifying(false);
    setStep(3);
  };

  const handleCopyReference = async () => {
    if (!intent) return;
    const copied = await copyTextToClipboard(intent.reference);
    setFeedback(copied ? "Referencia copiada." : "No se pudo copiar la referencia.");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Recarga operativa</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recarga saldo operativo para continuar con tus votaciones.
          </p>
        </div>

        <div className="mb-7">
          <AdminTvdStepper currentStep={step} />
        </div>

        {step === 1 ? (
          <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-stretch">
                <div className="min-w-0">
                  <label
                    htmlFor="recharge-amount"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Monto a recargar
                  </label>
                  <div className="mt-2 flex w-full max-w-full items-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#459151] focus-within:ring-2 focus-within:ring-[#459151]/15">
                    <input
                      id="recharge-amount"
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value.replace(/[^\d]/g, ""));
                        setSelectedPackageLabel("Monto personalizado");
                        setSelectedPackageId(null);
                      }}
                      inputMode="numeric"
                      aria-label="Monto a recargar"
                      className="w-0 min-w-0 flex-1 appearance-none border-0 bg-transparent text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-400 sm:text-3xl"
                    />
                    <span className="ml-3 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                      $TVD
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      amountIsValid ? "text-slate-500" : "font-medium text-slate-500"
                    }`}
                  >
                    {amountHelpMessage}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl bg-[#EFF7F0] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#2E6A38]">
                    Resumen de recarga
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Equivalente estimado
                  </p>
                  <output
                    htmlFor="recharge-amount"
                    aria-label="Equivalente estimado"
                    className="mt-1 block text-3xl font-bold text-[#2E6A38]"
                  >
                    Bs. {amountBs}
                  </output>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Calculado según la tarifa operativa actual.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">Otras opciones</p>
              <div className="grid gap-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    aria-pressed={selectedPackageId === pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left transition ${
                      selectedPackageId === pkg.id
                        ? "border-[#459151] bg-[#EFF7F0] shadow-sm"
                        : "border-slate-200 bg-white hover:border-[#459151]/50 hover:bg-[#F7FBF8]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">{pkg.label}</span>
                      <span className="mt-1 block text-sm font-semibold text-slate-700">
                        {formatTvdAmount(pkg.tvdAmount)} $TVD
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {pkg.description.replace(/^[^·]+·\s*/, "")}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <strong className="text-[#2E6A38]">Bs. {pkg.bsAmount}</strong>
                      {selectedPackageId === pkg.id ? (
                        <span className="rounded-full bg-[#459151] px-2.5 py-1 text-xs font-bold text-white">
                          Seleccionado
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueToQr}
              disabled={!amountIsValid}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#459151] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              Continuar
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </section>
        ) : null}

        {step === 2 && intent ? (
          <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-7">
            <div className="mx-auto mb-5 flex w-fit rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <KioskQrSvg value={qrPayload} size={168} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Escanea el QR para completar la recarga</h2>
            <p className="mt-2 text-sm text-slate-500">
              Cuando confirmes el pago, toca el botón de abajo.
            </p>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              QR válido por {intent.expiresInMinutes} minutos
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => setFeedback("QR preparado para descarga.")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Descargar QR
              </button>
              <button
                type="button"
                onClick={() => void handleVerify()}
                disabled={verifying}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:opacity-60"
              >
                {verifying ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                {verifying ? "Verificando pago..." : "Ya realicé el pago"}
              </button>
            </div>
            {feedback ? <p className="mt-4 text-sm text-[#2E6A38]">{feedback}</p> : null}
          </section>
        ) : null}

        {step === 3 && intent ? (
          <section className="mx-auto max-w-md rounded-2xl border border-green-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-[#2E6A38]">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Recarga completada</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ya puedes continuar con tu votación.
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">Paquete elegido</span>
                <strong className="text-slate-900">{selectedPackageLabel}</strong>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">Monto</span>
                <strong className="text-[#2E6A38]">{intent.amountTvd} $TVD</strong>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">Referencia</span>
                <strong className="text-slate-900">{intent.reference}</strong>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleCopyReference()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                Copiar referencia
              </button>
              <button
                type="button"
                onClick={() => navigate("/votacion/elecciones")}
                className="rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44]"
              >
                Continuar
              </button>
            </div>
            {feedback ? <p className="mt-4 text-sm text-[#2E6A38]">{feedback}</p> : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
