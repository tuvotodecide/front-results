"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import {
  useCreateTvdManualAssignmentMutation,
  useGetTvdManualAssignmentQuery,
  useListTvdAdminInstitutionWalletsQuery,
  useListTvdAdminInstitutionsQuery,
} from "@/store/tvd";
import type {
  CreateTvdManualAssignmentRequest,
  TvdAdminInstitution,
  TvdAdminInstitutionWallet,
  TvdManualAssignmentResponse,
} from "@/store/tvd";
import {
  buildTvdManualAssignmentPayloadFingerprint,
  createTvdManualAssignmentIdempotencyKey,
  extractTvdManualAssignmentFromError,
  getTvdManualAssignmentErrorMessage,
  getTvdManualAssignmentStatusMessage,
  isTvdManualAssignmentTerminalStatus,
  normalizeTvdTokenAmount,
  validateTvdManualAssignmentAmount,
  validateTvdManualAssignmentReason,
} from "../utils/tvdManualAssignment";
import {
  buildExplorerTxUrl,
  getKnownBaseNetwork,
} from "@/shared/tvd/tvdBlockchainFormatters";

type AssignmentStep = 1 | 2 | 3;

type AttemptState = {
  fingerprint: string;
  key: string;
};

const steps: Array<{ id: AssignmentStep; label: string }> = [
  { id: 1, label: "Seleccionar institución" },
  { id: 2, label: "Elegir wallet y monto" },
  { id: 3, label: "Confirmación" },
];

const emptyErrors = {
  institution: "",
  wallet: "",
  amount: "",
  reason: "",
};

const FieldError = ({ children }: { children?: string }) =>
  children ? (
    <p className="mt-1 text-xs text-[#b42318]" role="alert">
      {children}
    </p>
  ) : null;

const StatusPill = ({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}) => {
  const className = {
    success: "border-[#b8d9bd] bg-[#eef8ef] text-[#287c36]",
    warning: "border-[#f3ca72] bg-[#fff8e8] text-[#a45400]",
    danger: "border-[#f0b4aa] bg-[#fff1ef] text-[#b42318]",
    neutral: "border-[#dfe3df] bg-[#f7f8f7] text-[#666]",
  }[tone];

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
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

const statusTone = (
  status: TvdManualAssignmentResponse["status"],
): "success" | "warning" | "danger" | "neutral" => {
  if (status === "CONFIRMED") return "success";
  if (status === "NEEDS_REVIEW" || status === "SUBMITTED") return "warning";
  if (status === "FAILED") return "danger";
  return "neutral";
};

const isSelectableWallet = (wallet: TvdAdminInstitutionWallet) =>
  wallet.eligible && Boolean(wallet.wallet);

const shortenMiddle = (value?: string | null, start = 10, end = 8) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (normalized.length <= start + end + 3) return normalized;
  return `${normalized.slice(0, start)}...${normalized.slice(-end)}`;
};

export default function TvdManualAssignmentPage() {
  const [step, setStep] = useState<AssignmentStep>(1);
  const [search, setSearch] = useState("");
  const [selectedInstitution, setSelectedInstitution] =
    useState<TvdAdminInstitution | null>(null);
  const [selectedWallet, setSelectedWallet] =
    useState<TvdAdminInstitutionWallet | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState(emptyErrors);
  const [operationError, setOperationError] = useState("");
  const [createdAssignment, setCreatedAssignment] =
    useState<TvdManualAssignmentResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const attemptRef = useRef<AttemptState | null>(null);

  const institutionsQuery = useListTvdAdminInstitutionsQuery({
    search: search.trim() || undefined,
    page: 1,
    limit: 10,
  });
  const walletsQuery = useListTvdAdminInstitutionWalletsQuery(
    selectedInstitution?.tenantId ?? "",
    { skip: !selectedInstitution?.tenantId },
  );
  const [createManualAssignment, createState] =
    useCreateTvdManualAssignmentMutation();

  const trackedAssignmentId = createdAssignment?.id ?? "";
  const currentStatus = createdAssignment?.status ?? null;
  const detailQuery = useGetTvdManualAssignmentQuery(trackedAssignmentId, {
    skip: !trackedAssignmentId,
    pollingInterval:
      currentStatus && !isTvdManualAssignmentTerminalStatus(currentStatus)
        ? 5000
        : 0,
    refetchOnMountOrArgChange: true,
  });

  const institutionItems = institutionsQuery.currentData?.items ?? [];
  const walletItems = walletsQuery.currentData?.wallets ?? [];
  const selectedWalletStillCurrent = selectedWallet
    ? walletItems.some((wallet) => wallet.assignmentId === selectedWallet.assignmentId)
    : true;
  const assignmentResult =
    trackedAssignmentId
      ? detailQuery.currentData ?? detailQuery.data ?? createdAssignment
      : null;
  const isBusy = submitting || createState.isLoading;

  useEffect(() => {
    if (detailQuery.currentData) {
      setCreatedAssignment(detailQuery.currentData);
    }
  }, [detailQuery.currentData]);

  const resetOperationResult = () => {
    setOperationError("");
    setCreatedAssignment(null);
  };

  const resetAttempt = () => {
    attemptRef.current = null;
  };

  const resetWizard = () => {
    setStep(1);
    setSearch("");
    setSelectedInstitution(null);
    setSelectedWallet(null);
    setAmount("");
    setReason("");
    setErrors(emptyErrors);
    resetOperationResult();
    resetAttempt();
  };

  const selectInstitution = (institution: TvdAdminInstitution) => {
    if (!institution.active) {
      setErrors((current) => ({
        ...current,
        institution: "La institución seleccionada está deshabilitada.",
      }));
      return;
    }
    if (institution.eligibleWalletsCount <= 0) {
      setErrors((current) => ({
        ...current,
        institution: "La institución no tiene wallets verificadas disponibles.",
      }));
      return;
    }
    setSelectedInstitution(institution);
    setSelectedWallet(null);
    setErrors(emptyErrors);
    resetOperationResult();
    resetAttempt();
    setStep(2);
  };

  const selectWallet = (wallet: TvdAdminInstitutionWallet) => {
    if (!isSelectableWallet(wallet)) {
      setErrors((current) => ({
        ...current,
        wallet: "Selecciona una wallet verificada y habilitada.",
      }));
      return;
    }
    setSelectedWallet(wallet);
    setErrors((current) => ({ ...current, wallet: "" }));
    resetOperationResult();
    resetAttempt();
  };

  const buildPayload = (): CreateTvdManualAssignmentRequest | null => {
    if (!selectedInstitution || !selectedWallet) return null;
    const tokenAmount = normalizeTvdTokenAmount(amount);
    if (!tokenAmount) return null;
    return {
      tenantId: selectedInstitution.tenantId,
      assignmentId: selectedWallet.assignmentId,
      tokenAmount,
      reason: reason.trim(),
    };
  };

  const validateAssignment = () => {
    const nextErrors = {
      ...emptyErrors,
      institution: selectedInstitution ? "" : "Selecciona una institución.",
      wallet: selectedWallet ? "" : "Selecciona una wallet institucional.",
      amount: validateTvdManualAssignmentAmount(amount) ?? "",
      reason: validateTvdManualAssignmentReason(reason) ?? "",
    };
    setErrors(nextErrors);
    return !nextErrors.institution && !nextErrors.wallet && !nextErrors.amount && !nextErrors.reason;
  };

  const reviewAssignment = () => {
    resetOperationResult();
    if (validateAssignment()) {
      setStep(3);
    }
  };

  const getAttemptKey = (payload: CreateTvdManualAssignmentRequest) => {
    const fingerprint = buildTvdManualAssignmentPayloadFingerprint(payload);
    if (attemptRef.current?.fingerprint === fingerprint) {
      return attemptRef.current.key;
    }
    const key = createTvdManualAssignmentIdempotencyKey();
    attemptRef.current = { fingerprint, key };
    return key;
  };

  const submitAssignment = async () => {
    if (isBusy || !validateAssignment()) return;
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    setOperationError("");
    try {
      const result = await createManualAssignment({
        body: payload,
        idempotencyKey: getAttemptKey(payload),
      }).unwrap();
      setCreatedAssignment(result);
    } catch (error) {
      const recovered = extractTvdManualAssignmentFromError(error);
      if (recovered) {
        setCreatedAssignment(recovered);
      }
      const message = getTvdManualAssignmentErrorMessage(error);
      if (message.includes("intento cambiaron")) {
        resetAttempt();
      }
      setOperationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasInstitutionsError = Boolean(institutionsQuery.error);
  const hasWalletsError = Boolean(walletsQuery.error);

  const assignmentStatusMessage = assignmentResult
    ? getTvdManualAssignmentStatusMessage(assignmentResult.status)
    : "";
  if (assignmentResult) {
    const canRetryStatus =
      assignmentResult.status === "FAILED" &&
      assignmentResult.failureCategory === "RETRYABLE";
    const txExplorerUrl = buildExplorerTxUrl(
      getKnownBaseNetwork(assignmentResult.chainId).explorerBaseUrl,
      assignmentResult.txHash,
    );
    return (
      <section>
        <SuperadminPageHeader
          title="Resultado de asignación"
          subtitle="Resumen de la operación"
        />
        <div className="mx-auto max-w-xl rounded-2xl border border-[#dfe6df] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                assignmentResult.status === "CONFIRMED"
                  ? "bg-[#e7f2e8] text-[#287c36]"
                  : assignmentResult.status === "FAILED"
                    ? "bg-[#fff1ef] text-[#b42318]"
                    : "bg-[#fff8e8] text-[#a45400]"
              }`}
            >
              {assignmentResult.status === "CONFIRMED" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : assignmentResult.status === "FAILED" ? (
                <AlertCircle className="h-6 w-6" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[#3f3f3f]">{assignmentStatusMessage}</h2>
              {detailQuery.error ? (
                <div className="mt-3 rounded-lg border border-[#f0b4aa] bg-[#fff1ef] px-4 py-3 text-sm text-[#b42318]">
                  {getTvdManualAssignmentErrorMessage(detailQuery.error)}
                </div>
              ) : null}
            </div>
          </div>

          <dl className="mt-5 rounded-lg bg-[#f7f8f7] p-4 text-sm">
            <div className="grid gap-1 border-b border-[#e4e8e4] py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <dt className="text-[#777]">Estado</dt>
              <dd className="min-w-0 sm:text-right">
                <StatusPill
                  label={assignmentStatusMessage}
                  tone={statusTone(assignmentResult.status)}
                />
              </dd>
            </div>
            <div className="grid gap-1 border-b border-[#e4e8e4] py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <dt className="text-[#777]">Institución</dt>
              <dd className="min-w-0 truncate font-medium text-[#333] sm:text-right" title={selectedInstitution?.name ?? undefined}>
                {selectedInstitution?.name ?? "No disponible"}
              </dd>
            </div>
            <div className="grid gap-1 border-b border-[#e4e8e4] py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <dt className="text-[#777]">Wallet destino</dt>
              <dd
                className="min-w-0 truncate font-mono text-xs text-[#333] sm:text-right"
                title={assignmentResult.targetWallet}
              >
                {shortenMiddle(assignmentResult.targetWallet, 10, 8)}
              </dd>
            </div>
            <div className="grid gap-1 border-b border-[#e4e8e4] py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <dt className="text-[#777]">Monto</dt>
              <dd className="min-w-0 font-semibold text-[#287c36] sm:text-right">
                {assignmentResult.tokenAmount} TVD
              </dd>
            </div>
            <div className="grid gap-1 border-b border-[#e4e8e4] py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start sm:gap-4">
              <dt className="text-[#777]">Motivo</dt>
              <dd className="min-w-0 text-[#333] sm:text-right">{assignmentResult.reason}</dd>
            </div>
            {assignmentResult.txHash ? (
              <div className="grid gap-2 py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                <dt className="whitespace-nowrap text-[#777]">Tx Hash</dt>
                <dd className="flex min-w-0 flex-col gap-2 sm:items-end">
                  <span
                    className="max-w-full truncate font-mono text-xs font-semibold text-[#287c36]"
                    title={assignmentResult.txHash}
                  >
                    {shortenMiddle(assignmentResult.txHash, 10, 8)}
                  </span>
                  <span className="flex flex-wrap gap-2 sm:justify-end">
                    <CopyButton value={assignmentResult.txHash} label="Copiar" />
                    {txExplorerUrl ? (
                      <a
                        href={txExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#dfe6df] px-2.5 py-1.5 text-xs font-medium text-[#4b4b4b] transition-colors hover:border-[#287c36] hover:text-[#287c36]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver en BaseScan
                      </a>
                    ) : null}
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {canRetryStatus ? (
              <button
                type="button"
                onClick={() => void detailQuery.refetch()}
                disabled={detailQuery.isFetching}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#dfe3df] px-4 py-2 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${detailQuery.isFetching ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetWizard}
              className="inline-flex items-center justify-center rounded-md bg-[#287c36] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] sm:w-auto"
            >
              Volver a asignaciones
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SuperadminPageHeader
        title="Asignación de TVD"
        subtitle={
          step === 3
            ? "Revisa los datos antes de asignar"
            : "Asignar TVD a una wallet institucional verificada"
        }
      />
      <Stepper currentStep={step} />

      {step === 1 ? (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            1. Seleccionar institución
          </h2>
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="text-sm font-medium text-[#3f3f3f]">
                Buscar institución
              </span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedInstitution(null);
                  setSelectedWallet(null);
                  setErrors(emptyErrors);
                  resetOperationResult();
                  resetAttempt();
                }}
                placeholder="Nombre de la institución"
                className="mt-1 w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none transition-colors focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
              />
            </label>

            {institutionsQuery.isFetching ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#dfe3df] bg-[#f7f8f7] px-4 py-3 text-sm text-[#666]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando instituciones...
              </div>
            ) : null}

            {hasInstitutionsError ? (
              <div className="rounded-lg border border-[#f0b4aa] bg-[#fff1ef] px-4 py-3 text-sm text-[#b42318]">
                No pudimos cargar las instituciones.
                <button
                  type="button"
                  onClick={() => void institutionsQuery.refetch()}
                  className="ml-2 font-semibold underline"
                >
                  Reintentar
                </button>
              </div>
            ) : null}

            {!institutionsQuery.isFetching && !hasInstitutionsError && institutionItems.length === 0 ? (
              <div className="rounded-lg border border-[#dfe3df] bg-[#f7f8f7] px-4 py-3 text-sm text-[#666]">
                No hay instituciones disponibles para asignación TVD.
              </div>
            ) : null}

            <div className="space-y-3">
              {institutionItems.map((institution) => {
                const selectable = institution.active && institution.eligibleWalletsCount > 0;
                return (
                  <button
                    key={institution.tenantId}
                    type="button"
                    onClick={() => selectInstitution(institution)}
                    className={`grid w-full gap-3 rounded-lg border p-4 text-left transition-colors sm:grid-cols-[1fr_auto] sm:items-center ${
                      selectable
                        ? "border-[#dfe3df] hover:border-[#88b98f] hover:bg-[#fbfdfb]"
                        : "border-[#ececec] bg-[#fafafa] opacity-80"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-medium text-[#3f3f3f]">
                        {institution.name}
                      </span>
                      <span className="mt-1 block text-xs text-[#777]">
                        {institution.eligibleWalletsCount === 1
                          ? "1 wallet disponible"
                          : `${institution.eligibleWalletsCount} wallets disponibles`}
                      </span>
                    </span>
                    <StatusPill
                      label={institution.active ? "Activa" : "Deshabilitada"}
                      tone={selectable ? "success" : "warning"}
                    />
                  </button>
                );
              })}
            </div>
            <FieldError>{errors.institution}</FieldError>
          </div>
        </div>
      ) : null}

      {step === 2 && selectedInstitution ? (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
            <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            2. Wallet y datos de asignación
          </h2>
          <div className="space-y-5 p-5">
            <div className="rounded-lg border border-[#dfe3df] bg-[#f7f8f7] p-4">
              <p className="text-xs text-[#777]">Institución seleccionada</p>
              <p className="mt-1 text-sm font-medium text-[#3f3f3f]">
                {selectedInstitution.name}
              </p>
            </div>

            {walletsQuery.isFetching ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#dfe3df] bg-[#f7f8f7] px-4 py-3 text-sm text-[#666]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando wallets institucionales...
              </div>
            ) : null}

            {hasWalletsError ? (
              <div className="rounded-lg border border-[#f0b4aa] bg-[#fff1ef] px-4 py-3 text-sm text-[#b42318]">
                No pudimos cargar las wallets de esta institución.
                <button
                  type="button"
                  onClick={() => void walletsQuery.refetch()}
                  className="ml-2 font-semibold underline"
                >
                  Reintentar
                </button>
              </div>
            ) : null}

            {!walletsQuery.isFetching && !hasWalletsError && walletItems.length === 0 ? (
              <div className="rounded-lg border border-[#dfe3df] bg-[#f7f8f7] px-4 py-3 text-sm text-[#666]">
                Esta institución no tiene wallets registradas.
              </div>
            ) : null}

            {!selectedWalletStillCurrent ? (
              <div className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
                La wallet seleccionada ya no corresponde a la institución actual.
              </div>
            ) : null}

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[#3f3f3f]">
                Seleccionar wallet <span className="text-[#b42318]">*</span>
              </legend>
              {walletItems.map((wallet) => {
                const selectable = isSelectableWallet(wallet);
                const selected = selectedWallet?.assignmentId === wallet.assignmentId;
                return (
                  <button
                    key={wallet.assignmentId}
                    type="button"
                    onClick={() => selectWallet(wallet)}
                    className={`grid w-full gap-3 rounded-lg border p-4 text-left transition-colors sm:grid-cols-[1fr_auto] sm:items-center ${
                      selected
                        ? "border-[#287c36] bg-[#eef8ef]"
                        : selectable
                          ? "border-[#dfe3df] hover:border-[#88b98f] hover:bg-[#fbfdfb]"
                          : "border-[#ececec] bg-[#fafafa] opacity-80"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="block break-all font-mono text-xs text-[#555]">
                          {wallet.wallet ?? "Sin wallet"}
                        </span>
                      </span>
                    </span>
                    {selectable ? (
                      <StatusPill label="Elegible" tone="success" />
                    ) : null}
                  </button>
                );
              })}
              <FieldError>{errors.wallet}</FieldError>
            </fieldset>

            <label className="block">
              <span className="text-sm font-medium text-[#3f3f3f]">
                Cantidad TVD <span className="text-[#b42318]">*</span>
              </span>
              <div className="mt-1 flex rounded-lg border border-[#dfe3df] bg-white focus-within:border-[#287c36] focus-within:ring-2 focus-within:ring-[#287c36]/10">
                <input
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    resetOperationResult();
                  }}
                  inputMode="decimal"
                  className="min-w-0 flex-1 rounded-l-lg px-4 py-3 text-sm outline-none"
                />
                <span className="flex items-center px-4 text-sm text-[#777]">
                  TVD
                </span>
              </div>
              <FieldError>{errors.amount}</FieldError>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#3f3f3f]">
                Motivo <span className="text-[#b42318]">*</span>
              </span>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  resetOperationResult();
                }}
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none transition-colors focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
              />
              <FieldError>{errors.reason}</FieldError>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedWallet(null);
                  resetOperationResult();
                }}
                className="rounded-lg border border-[#dfe3df] px-4 py-3 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7]"
              >
                Cambiar institución
              </button>
              <button
                type="button"
                onClick={reviewAssignment}
                disabled={walletsQuery.isFetching || hasWalletsError}
                className="w-full rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 && selectedInstitution && selectedWallet ? (
        <div className="mx-auto max-w-xl space-y-5">
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
                  {selectedWallet.wallet}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#e8ece8] py-3">
                <dt className="text-[#777]">Cantidad</dt>
                <dd className="font-semibold text-[#287c36]">
                  {normalizeTvdTokenAmount(amount) ?? amount} TVD
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-[#777]">Motivo</dt>
                <dd className="text-right text-[#333]">{reason.trim()}</dd>
              </div>
            </dl>
          </div>

          {operationError ? (
            <div className="rounded-lg border border-[#f0b4aa] bg-[#fff1ef] px-4 py-3 text-sm text-[#b42318]" role="alert">
              {operationError}
            </div>
          ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isBusy}
                className="rounded-lg border border-[#dfe3df] px-4 py-3 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => void submitAssignment()}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                Asignar
              </button>
            </div>
        </div>
      ) : null}
    </section>
  );
}
