"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Loader2,
} from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import {
  BASE_EXPLORER_URL,
  mockAssignmentSourceFund,
  mockAssignmentSourceWallet,
  tvdAssignmentReasonsMock,
  tvdInstitutionsMock,
} from "../data/superadminTvd.mock";
import { createTvdManualAssignment } from "../services/superadminTvdApi";
import type {
  TvdAssignmentDraft,
  TvdAssignmentReceipt,
  TvdInstitution,
} from "../types";

type AssignmentStep = 1 | 2 | 3;
type AssignmentStatus = "editing" | "signing" | "confirmed";

const steps: Array<{ id: AssignmentStep; label: string }> = [
  { id: 1, label: "Seleccionar institución" },
  { id: 2, label: "Confirmar monto" },
  { id: 3, label: "Confirmación" },
];

const emptyErrors = {
  institution: "",
  amount: "",
  reason: "",
  auditReason: "",
};

const Stepper = ({ currentStep }: { currentStep: AssignmentStep }) => (
  <ol className="mb-7 grid grid-cols-3 items-start gap-2 sm:gap-6">
    {steps.map((step, index) => {
      const isDone = step.id < currentStep;
      const isActive = step.id === currentStep;

      return (
        <li key={step.id} className="relative flex flex-col items-center gap-2">
          {index > 0 ? (
            <span
              className={`absolute right-1/2 top-4 h-0.5 w-full -translate-x-5 sm:-translate-x-8 ${
                isDone || isActive ? "bg-[#287c36]" : "bg-[#dfe3df]"
              }`}
            />
          ) : null}
          <span
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
              isDone
                ? "border-[#287c36] bg-[#287c36] text-white"
                : isActive
                  ? "border-[#287c36] bg-white text-[#287c36]"
                  : "border-[#cfd5d0] bg-white text-[#899089]"
            }`}
          >
            {isDone ? <Check className="h-4 w-4" /> : step.id}
          </span>
          <span
            className={`text-center text-[11px] sm:text-xs ${
              isDone || isActive ? "text-[#287c36]" : "text-[#777]"
            }`}
          >
            {step.label}
          </span>
        </li>
      );
    })}
  </ol>
);

const FieldError = ({ children }: { children?: string }) =>
  children ? <p className="mt-1 text-xs text-[#b42318]">{children}</p> : null;

const StatusPill = ({ status }: { status: TvdInstitution["status"] }) => (
  <span
    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
      status === "Validada"
        ? "border-[#b8d9bd] bg-[#eef8ef] text-[#287c36]"
        : "border-[#f3ca72] bg-[#fff8e8] text-[#c76b00]"
    }`}
  >
    {status}
  </span>
);

export default function TvdAssignmentPage() {
  const [step, setStep] = useState<AssignmentStep>(1);
  const [status, setStatus] = useState<AssignmentStatus>("editing");
  const [search, setSearch] = useState("");
  const [selectedInstitution, setSelectedInstitution] =
    useState<TvdInstitution | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<string>(tvdAssignmentReasonsMock[0] ?? "");
  const [auditReason, setAuditReason] = useState("");
  const [errors, setErrors] = useState(emptyErrors);
  const [receipt, setReceipt] = useState<TvdAssignmentReceipt | null>(null);

  const filteredInstitutions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return tvdInstitutionsMock;
    return tvdInstitutionsMock.filter((institution) =>
      institution.name.toLowerCase().includes(normalized),
    );
  }, [search]);

  const selectInstitution = (institution: TvdInstitution) => {
    if (institution.status !== "Validada") {
      setErrors((current) => ({
        ...current,
        institution: "Solo se puede continuar con instituciones validadas.",
      }));
      return;
    }

    setSelectedInstitution(institution);
    setErrors((current) => ({ ...current, institution: "" }));
    setStep(2);
  };

  const validateAssignment = () => {
    const numericAmount = Number(amount);
    const nextErrors = {
      ...emptyErrors,
      amount:
        !amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0
          ? "Ingresa un monto numérico mayor a 0."
          : "",
      reason: reason ? "" : "Selecciona un motivo.",
      auditReason: auditReason.trim()
        ? ""
        : "Describe la razón auditada de la asignación.",
    };

    setErrors(nextErrors);
    return !nextErrors.amount && !nextErrors.reason && !nextErrors.auditReason;
  };

  const buildDraft = (): TvdAssignmentDraft | null => {
    if (!selectedInstitution) return null;

    return {
      institution: selectedInstitution,
      destinationWallet: selectedInstitution.wallet,
      amount,
      reason,
      auditedContext: auditReason,
      sourceFund: mockAssignmentSourceFund,
    };
  };

  const reviewAssignment = () => {
    if (validateAssignment()) {
      setStep(3);
    }
  };

  const signAssignment = async () => {
    const draft = buildDraft();
    if (!draft) return;

    setStatus("signing");
    const nextReceipt = await createTvdManualAssignment(draft);
    setReceipt(nextReceipt);
    setStatus("confirmed");
  };

  const resetWizard = () => {
    setStep(1);
    setStatus("editing");
    setSearch("");
    setSelectedInstitution(null);
    setAmount("");
    setReason(tvdAssignmentReasonsMock[0] ?? "");
    setAuditReason("");
    setErrors(emptyErrors);
    setReceipt(null);
  };

  const explorerTxUrl = receipt
    ? `${BASE_EXPLORER_URL}/tx/${receipt.txHash}`
    : BASE_EXPLORER_URL;

  if (status === "signing" && selectedInstitution) {
    return (
      <section>
        <SuperadminPageHeader
          title="Asignación de $TVD"
          subtitle="Firmando operación"
        />
        <div className="mx-auto max-w-md rounded-2xl border border-[#dfe6df] bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3cd] text-[#c76b00]">
            <Loader2 className="h-7 w-7 animate-spin" />
          </span>
          <h2 className="mt-5 font-semibold text-[#3f3f3f]">
            Confirmar operación en MetaMask
          </h2>
          <p className="mt-1 text-sm text-[#c76b00]">
            Esperando firma en MetaMask...
          </p>
          <dl className="mt-5 rounded-lg bg-[#f7f8f7] p-4 text-sm">
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-[#777]">Wallet origen</dt>
              <dd className="break-all text-right font-mono text-xs text-[#333]">
                {mockAssignmentSourceWallet}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-[#777]">Wallet destino</dt>
              <dd className="break-all text-right font-mono text-xs text-[#333]">
                {selectedInstitution.wallet}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-[#777]">Monto</dt>
              <dd className="font-medium text-[#333]">{amount} $TVD</dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-[#777]">Red</dt>
              <dd className="font-medium text-[#333]">Base L2</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => setStatus("editing")}
            className="mt-5 rounded-md border border-[#dfe3df] px-5 py-2 text-sm text-[#555] transition-colors hover:bg-[#f7f8f7]"
          >
            Cancelar
          </button>
        </div>
      </section>
    );
  }

  if (status === "confirmed" && receipt) {
    return (
      <section>
        <SuperadminPageHeader
          title="Asignación de $TVD"
          subtitle="Resultado de la operación"
        />
        <div className="mx-auto max-w-xl rounded-2xl border border-[#c7e3ca] bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f2e8] text-[#287c36]">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-5 font-semibold text-[#3f3f3f]">
            Transacción confirmada
          </h2>
          <p className="mt-1 text-sm text-[#747474]">
            La operación fue registrada en la red.
          </p>
          <dl className="mt-5 rounded-lg bg-[#f7f8f7] p-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-[#e4e8e4] py-2">
              <dt className="text-[#777]">Institución</dt>
              <dd className="text-right font-medium text-[#333]">
                {receipt.institution.name}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#e4e8e4] py-2">
              <dt className="text-[#777]">Wallet destino</dt>
              <dd className="break-all text-right font-mono text-xs text-[#333]">
                {receipt.destinationWallet}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#e4e8e4] py-2">
              <dt className="text-[#777]">Monto</dt>
              <dd className="font-semibold text-[#287c36]">
                {receipt.amount} $TVD
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#e4e8e4] py-2">
              <dt className="text-[#777]">Contexto</dt>
              <dd className="text-right text-[#333]">
                {receipt.auditedContext}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-[#777]">txHash</dt>
              <dd className="break-all text-right font-mono text-xs text-[#287c36]">
                {receipt.txHash}
              </dd>
            </div>
          </dl>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <CopyButton value={receipt.txHash} label="Copiar txHash" />
            <a
              href={explorerTxUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#dfe3df] px-4 py-2 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7]"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en explorer
            </a>
            <button
              type="button"
              onClick={resetWizard}
              className="rounded-md bg-[#287c36] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b]"
            >
              Nueva asignación
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SuperadminPageHeader
        title="Asignación de $TVD"
        subtitle={
          step === 3
            ? "Revisa los datos antes de firmar"
            : "Asignar $TVD a una institución"
        }
      />
      <Stepper currentStep={step} />

      {step === 1 ? (
        <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            1. Seleccionar institución
          </h2>
          <div className="space-y-4 p-5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar institución"
              className="w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none transition-colors focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
            />
            <div className="space-y-3">
              {filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  onClick={() => selectInstitution(institution)}
                  className={`grid w-full gap-3 rounded-lg border p-4 text-left transition-colors sm:grid-cols-[1fr_auto] sm:items-center ${
                    institution.status === "Validada"
                      ? "border-[#dfe3df] hover:border-[#88b98f] hover:bg-[#fbfdfb]"
                      : "border-[#ececec] bg-[#fafafa] opacity-75"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-medium text-[#3f3f3f]">
                      {institution.name}
                    </span>
                    <span className="mt-1 block font-mono text-xs text-[#777]">
                      {institution.wallet}
                    </span>
                  </span>
                  <StatusPill status={institution.status} />
                </button>
              ))}
            </div>
            <FieldError>{errors.institution}</FieldError>
          </div>
        </div>
      ) : null}

      {step === 2 && selectedInstitution ? (
        <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            2. Datos de asignación
          </h2>
          <div className="space-y-5 p-5">
            <label className="block">
              <span className="text-sm font-medium text-[#3f3f3f]">
                Monto en $TVD <span className="text-[#b42318]">*</span>
              </span>
              <div className="mt-1 flex rounded-lg border border-[#dfe3df] bg-white focus-within:border-[#287c36] focus-within:ring-2 focus-within:ring-[#287c36]/10">
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  className="min-w-0 flex-1 rounded-l-lg px-4 py-3 text-sm outline-none"
                />
                <span className="flex items-center px-4 text-sm text-[#777]">
                  $TVD
                </span>
              </div>
              <FieldError>{errors.amount}</FieldError>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#3f3f3f]">
                Motivo <span className="text-[#b42318]">*</span>
              </span>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dfe3df] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
              >
                {tvdAssignmentReasonsMock.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError>{errors.reason}</FieldError>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#3f3f3f]">
                Debe describir la razón porque esto está auditado{" "}
                <span className="text-[#b42318]">*</span>
              </span>
              <textarea
                value={auditReason}
                onChange={(event) => setAuditReason(event.target.value)}
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none transition-colors focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
              />
              <FieldError>{errors.auditReason}</FieldError>
            </label>

            <div className="rounded-lg border border-[#dfe3df] bg-[#f7f8f7] p-4">
              <p className="text-xs text-[#777]">Wallet destino</p>
              <p className="mt-2 break-all font-mono text-sm text-[#333]">
                {selectedInstitution.wallet}
              </p>
              <div className="mt-3">
                <StatusPill status={selectedInstitution.status} />
              </div>
            </div>

            <button
              type="button"
              onClick={reviewAssignment}
              className="w-full rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b]"
            >
              Revisar y firmar
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 && selectedInstitution ? (
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
            <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
              Resumen de operación
            </h2>
            <dl className="p-5 text-sm">
              <div className="flex justify-between gap-4 border-b border-[#e8ece8] py-3">
                <dt className="text-[#777]">Institución</dt>
                <dd className="text-right font-medium text-[#333]">
                  {selectedInstitution.name}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#e8ece8] py-3">
                <dt className="text-[#777]">Wallet destino</dt>
                <dd className="break-all text-right font-mono text-xs text-[#333]">
                  {selectedInstitution.wallet}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#e8ece8] py-3">
                <dt className="text-[#777]">Monto</dt>
                <dd className="font-semibold text-[#287c36]">{amount} $TVD</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#e8ece8] py-3">
                <dt className="text-[#777]">Motivo</dt>
                <dd className="text-right text-[#333]">{reason}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#e8ece8] py-3">
                <dt className="text-[#777]">Descripción</dt>
                <dd className="text-right text-[#333]">{auditReason}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-[#777]">Fondo de origen</dt>
                <dd className="text-right text-[#333]">
                  {mockAssignmentSourceFund}
                </dd>
              </div>
            </dl>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg border border-[#dfe3df] px-4 py-3 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7]"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={signAssignment}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b]"
            >
              <Clipboard className="h-4 w-4" />
              Firmar con MetaMask
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
