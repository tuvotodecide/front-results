"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useSearchParams } from "@/domains/votacion/navigation/compat-private";
import { selectAuth } from "@/store/auth/authSlice";
import {
  useCreateQrPaymentMutation,
  useGetMyTvdPaymentQuery,
  useGetMyTvdQuoteQuery,
  useGetMyTvdSummaryQuery,
  useListMyTvdPaymentsQuery,
  type MyTvdPaymentResponse,
  type PublicQrPaymentResponse,
} from "@/store/tvd";
import AdminTvdStepper from "../components/AdminTvdStepper";
import {
  createRechargePayloadFingerprint,
  formatDateTime,
  generatePaymentIdempotencyKey,
  getAccreditationStatusMessage,
  getPaymentId,
  getPaymentStatusMessage,
  getQrImageSource,
  isAccreditationTerminal,
  shouldPollPayment,
  validateBobAmount,
  validateRechargeDescription,
} from "../utils/rechargeFlow";
import { copyTextToClipboard } from "../services/clipboard";
import { useTvdVisualBalance } from "../hooks/useTvdVisualBalance";

type PaymentAttempt = {
  key: string;
  fingerprint: string;
};

const parseAmount = (value: string | null) => value?.trim() ?? "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getSafeApiMessage = (error: unknown, fallback: string) => {
  if (!isRecord(error)) return fallback;
  const data = error.data;
  if (isRecord(data)) {
    const code = typeof data.code === "string" ? data.code : null;
    if (code === "PAYMENT_IDEMPOTENCY_CONFLICT") {
      return "Los datos del intento cambiaron. Inicia una nueva generación de QR.";
    }
    if (code === "TVD_WALLET_NOT_VERIFIED") {
      return "Debes vincular tu wallet institucional antes de recargar.";
    }
    if (code === "TVD_ASSIGNMENT_NOT_FOUND") {
      return "No existe un contexto institucional operativo.";
    }
  }
  const status = error.status;
  if (status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permisos para realizar esta operación.";
  if (status === 409) return "Los datos del intento cambiaron. Inicia un nuevo intento.";
  if (typeof status === "number" && status >= 500) {
    return "Backend temporalmente no disponible. Reintenta en unos segundos.";
  }
  return fallback;
};

const getAccreditationStatus = (
  payment: MyTvdPaymentResponse | PublicQrPaymentResponse | null,
) => {
  if (!payment) return null;
  return "accreditationStatus" in payment
    ? payment.accreditationStatus
    : payment.tokenAccreditation?.status ?? null;
};

const getPaymentReference = (
  payment: MyTvdPaymentResponse | PublicQrPaymentResponse | null,
) => payment?.merchantReference ?? null;

const getPaymentAmount = (
  payment: MyTvdPaymentResponse | PublicQrPaymentResponse | null,
) => payment?.amount ?? null;

const getPaymentQuoteTokenAmount = (
  payment: MyTvdPaymentResponse | PublicQrPaymentResponse | null,
) => payment?.tvdQuote?.tokenAmount ?? null;

export default function OperationalRechargePage() {
  const auth = useSelector(selectAuth);
  const [searchParams] = useSearchParams();
  const tenantId = auth.activeContext?.tenantId ?? auth.user?.tenantId ?? null;
  const tenantName =
    auth.activeContext?.tenantName ?? auth.user?.tenantName ?? "Institución";
  const tenantContextKey = [
    auth.activeContext?.type ?? "",
    tenantId ?? "",
    auth.user?.id ?? "",
  ].join(":");

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState(() => parseAmount(searchParams.get("monto")));
  const [description, setDescription] = useState("Recarga operativa");
  const [debouncedAmount, setDebouncedAmount] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<PaymentAttempt | null>(null);
  const [createdPayment, setCreatedPayment] =
    useState<PublicQrPaymentResponse | null>(null);
  const [qrImageSource, setQrImageSource] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const previousContextKey = useRef(tenantContextKey);

  useEffect(() => {
    if (previousContextKey.current === tenantContextKey) return;
    previousContextKey.current = tenantContextKey;
    setStep(1);
    setDebouncedAmount(null);
    setAttempt(null);
    setCreatedPayment(null);
    setQrImageSource(null);
    setPaymentId(null);
    setPollingEnabled(false);
    setFeedback(null);
    setFormError(null);
  }, [tenantContextKey]);

  const amountValidation = useMemo(() => validateBobAmount(amount), [amount]);
  const descriptionValidation = useMemo(
    () => validateRechargeDescription(description),
    [description],
  );
  const currentPayload = useMemo(() => {
    if (!amountValidation.valid || !descriptionValidation.valid) return null;
    return {
      amount: amountValidation.amount,
      currency: "BOB" as const,
      description: descriptionValidation.description,
    };
  }, [amountValidation, descriptionValidation]);
  const currentFingerprint = currentPayload
    ? createRechargePayloadFingerprint(currentPayload)
    : null;

  useEffect(() => {
    if (!amountValidation.valid) {
      setDebouncedAmount(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedAmount(amountValidation.amount);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [amountValidation]);

  const {
    data: summary,
    error: summaryError,
    isFetching: isSummaryFetching,
    refetch: refetchSummary,
  } = useGetMyTvdSummaryQuery({ tenantId }, { skip: !tenantId });
  const quoteArg =
    debouncedAmount && summary?.walletStatus === "VERIFIED"
      ? { amount: debouncedAmount, currency: "BOB" as const }
      : undefined;
  const {
    data: quote,
    error: quoteError,
    isFetching: isQuoteFetching,
    refetch: refetchQuote,
  } = useGetMyTvdQuoteQuery(quoteArg ?? { amount: "0.01", currency: "BOB" }, {
    skip: !quoteArg,
  });
  const [createQrPayment, createQrState] = useCreateQrPaymentMutation();
  const paymentQuery = useGetMyTvdPaymentQuery(paymentId ?? "", {
    skip: !paymentId,
    pollingInterval: pollingEnabled ? 5000 : 0,
    refetchOnMountOrArgChange: true,
  });
  const historyQuery = useListMyTvdPaymentsQuery(
    { page: 1, limit: 5 },
    { skip: !tenantId },
  );
  const visualBalance = useTvdVisualBalance(
    summary?.wallet,
    summary?.contractAddress,
    summary?.chainId,
    tenantContextKey,
  );

  const activePayment = paymentQuery.data ?? createdPayment;
  const activeAccreditationStatus = getAccreditationStatus(activePayment);
  const quoteMatchesCurrent =
    currentPayload?.amount === debouncedAmount && quote?.fiatAmount === debouncedAmount;
  const canCreateQr =
    Boolean(currentPayload) &&
    quoteMatchesCurrent &&
    Boolean(quote) &&
    summary?.walletStatus === "VERIFIED" &&
    !createQrState.isLoading;
  const paymentShouldPoll = shouldPollPayment(activePayment);

  useEffect(() => {
    if (activePayment && !paymentShouldPoll) {
      setPollingEnabled(false);
    }
  }, [activePayment, paymentShouldPoll]);

  useEffect(() => {
    if (activeAccreditationStatus === "CONFIRMED") {
      void visualBalance.refetch();
      void historyQuery.refetch();
    }
  }, [activeAccreditationStatus, historyQuery.refetch, visualBalance.refetch]);

  const handleCreateQr = async () => {
    setFeedback(null);
    setFormError(null);
    if (!tenantId) {
      setFormError("No existe un contexto institucional activo.");
      return;
    }
    if (!currentPayload || !currentFingerprint) {
      setFormError("Ingresa un monto válido en BOB.");
      return;
    }
    if (!descriptionValidation.valid) {
      setFormError(descriptionValidation.message);
      return;
    }
    if (summary?.walletStatus !== "VERIFIED") {
      setFormError("Debes vincular tu wallet institucional antes de recargar.");
      return;
    }
    if (!quote || !quoteMatchesCurrent) {
      setFormError("Espera a que la cotización actual termine de cargar.");
      return;
    }

    const nextAttempt =
      attempt?.fingerprint === currentFingerprint
        ? attempt
        : {
            key: generatePaymentIdempotencyKey(),
            fingerprint: currentFingerprint,
          };
    setAttempt(nextAttempt);

    try {
      const payment = await createQrPayment({
        body: currentPayload,
        idempotencyKey: nextAttempt.key,
      }).unwrap();
      const nextPaymentId = getPaymentId(payment);
      setCreatedPayment(payment);
      setPaymentId(nextPaymentId);
      setPollingEnabled(Boolean(nextPaymentId));
      setQrImageSource(getQrImageSource(payment.qrImage));
      setStep(2);
      setFeedback("QR generado. Esperando confirmación del pago.");
      await historyQuery.refetch();
    } catch (error) {
      setFormError(
        getSafeApiMessage(error, "No pudimos generar el QR. Reintenta en unos segundos."),
      );
    }
  };

  const handleNewRecharge = () => {
    setStep(1);
    setAttempt(null);
    setCreatedPayment(null);
    setQrImageSource(null);
    setPaymentId(null);
    setPollingEnabled(false);
    setFeedback(null);
    setFormError(null);
  };

  const handleCopyReference = async () => {
    const reference = getPaymentReference(activePayment);
    if (!reference) return;
    const copied = await copyTextToClipboard(reference);
    setFeedback(copied ? "Referencia copiada." : "No se pudo copiar la referencia.");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Recarga operativa</h1>
            <p className="mt-1 text-sm text-slate-500">
              Genera un QR en BOB para recargar TVD en tu wallet institucional activa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refetchSummary();
              void visualBalance.refetch();
            }}
            disabled={isSummaryFetching || visualBalance.isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${
                isSummaryFetching || visualBalance.isLoading ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            />
            Actualizar saldo
          </button>
        </div>

        <div className="mb-7">
          <AdminTvdStepper currentStep={step} />
        </div>

        {!tenantId ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No existe un contexto institucional activo.
          </div>
        ) : null}

        {summaryError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getSafeApiMessage(
              summaryError,
              "No pudimos cargar tu cuenta TVD institucional.",
            )}
          </div>
        ) : null}

        {feedback ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-[#2E6A38]">
            {feedback}
          </div>
        ) : null}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Institución
              </p>
              <p className="mt-1 font-semibold text-slate-900">{tenantName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Wallet activa
              </p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                {summary?.wallet ?? "No disponible"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Saldo visual TVD
              </p>
              <p className="mt-1 text-lg font-bold text-[#2E6A38]">
                {visualBalance.isLoading
                  ? "Consultando..."
                  : visualBalance.data?.totalBalanceFormatted ??
                    summary?.totalBalance.formatted ??
                    "No disponible"}
              </p>
              {visualBalance.error ? (
                <p className="mt-1 text-xs text-amber-700">
                  No pudimos consultar el saldo actual. Backend validará las operaciones.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {step === 1 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="recharge-amount"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Monto BOB a pagar
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#459151] focus-within:ring-2 focus-within:ring-[#459151]/15">
                    <input
                      id="recharge-amount"
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setFeedback(null);
                        setFormError(null);
                        if (attempt) setAttempt(null);
                      }}
                      inputMode="decimal"
                      aria-describedby="recharge-amount-help"
                      className="w-0 min-w-0 flex-1 appearance-none border-0 bg-transparent text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-400 sm:text-3xl"
                      placeholder="10.50"
                    />
                    <span className="ml-3 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                      BOB
                    </span>
                  </div>
                  <p
                    id="recharge-amount-help"
                    className={`mt-2 text-sm ${
                      amountValidation.valid ? "text-slate-500" : "font-medium text-red-600"
                    }`}
                    role={amountValidation.valid ? undefined : "alert"}
                  >
                    {amountValidation.valid
                      ? "Backend recalculará y congelará la cotización real al crear el QR."
                      : amountValidation.message}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="recharge-description"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Descripción
                  </label>
                  <input
                    id="recharge-description"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setFormError(null);
                      if (attempt) setAttempt(null);
                    }}
                    maxLength={60}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
                  />
                  {!descriptionValidation.valid ? (
                    <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                      {descriptionValidation.message}
                    </p>
                  ) : null}
                </div>

                {formError ? (
                  <div
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {formError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleCreateQr()}
                  disabled={!canCreateQr}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#459151] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {createQrState.isLoading ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                  {createQrState.isLoading ? "Generando QR..." : "Generar QR"}
                </button>
              </div>

              <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#2E6A38]">
                  Cotización BOB/TVD
                </p>
                {isQuoteFetching ? (
                  <p className="mt-4 text-sm text-slate-600">Calculando cotización...</p>
                ) : null}
                {quoteError ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <p>
                      {getSafeApiMessage(
                        quoteError,
                        "No pudimos calcular la cotización.",
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => void refetchQuote()}
                      className="mt-2 text-sm font-bold text-amber-800 underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : null}
                {quote && quoteMatchesCurrent ? (
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Monto fiat</dt>
                      <dd className="font-bold text-slate-900">Bs. {quote.fiatAmount}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">TVD estimados</dt>
                      <dd className="text-2xl font-bold text-[#2E6A38]">
                        {quote.estimatedTvd} TVD
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Tasa</dt>
                      <dd className="font-semibold text-slate-900">
                        Bs. {quote.bobPerToken} por TVD
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Versión</dt>
                      <dd className="font-semibold text-slate-900">
                        {quote.exchangeRateVersion}
                      </dd>
                    </div>
                  </dl>
                ) : !isQuoteFetching && !quoteError ? (
                  <p className="mt-4 text-sm text-slate-600">
                    Ingresa un monto válido para ver una estimación.
                  </p>
                ) : null}
              </aside>
            </div>
          </section>
        ) : null}

        {step === 2 && activePayment ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-7">
              {qrImageSource && activePayment.status === "QR_ACTIVE" ? (
                <img
                  src={qrImageSource}
                  alt="Código QR para pagar la recarga TVD"
                  className="mx-auto h-56 w-56 rounded-xl border border-slate-200 bg-white p-3"
                />
              ) : (
                <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  QR no disponible para este estado.
                </div>
              )}

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Escanea el QR desde tu banca móvil
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                El webhook de Red Enlace confirmará el pago directamente con Backend Results.
              </p>

              <div className="mt-5 grid gap-3 text-left text-sm">
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Monto</span>
                  <strong className="text-slate-900">
                    Bs. {getPaymentAmount(activePayment) ?? "No disponible"}
                  </strong>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">TVD estimados</span>
                  <strong className="text-[#2E6A38]">
                    {getPaymentQuoteTokenAmount(activePayment) ?? "No disponible"}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Referencia</span>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <strong className="break-all font-mono text-slate-900">
                      {getPaymentReference(activePayment) ?? "No disponible"}
                    </strong>
                    <button
                      type="button"
                      onClick={() => void handleCopyReference()}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                      Copiar
                    </button>
                  </div>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Expira</span>
                  <strong className="text-slate-900">
                    {formatDateTime(activePayment.qrExpiresAt)}
                  </strong>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Estado del pago
                </p>
                <div className="mt-3 flex items-start gap-3">
                  {activePayment.status === "PAYMENT_CONFIRMED" ? (
                    <CheckCircleIcon className="h-6 w-6 text-[#2E6A38]" />
                  ) : paymentQuery.isFetching && paymentShouldPoll ? (
                    <ArrowPathIcon className="h-6 w-6 animate-spin text-slate-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{activePayment.status}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {getPaymentStatusMessage(activePayment.status)}
                    </p>
                  </div>
                </div>
                {paymentQuery.error ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {getSafeApiMessage(
                      paymentQuery.error,
                      "No pudimos consultar el estado del pago.",
                    )}
                    <button
                      type="button"
                      onClick={() => void paymentQuery.refetch()}
                      className="ml-2 font-bold underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Acreditación TVD
                </p>
                <div className="mt-3 flex items-start gap-3">
                  {activeAccreditationStatus === "CONFIRMED" ? (
                    <CheckCircleIcon className="h-6 w-6 text-[#2E6A38]" />
                  ) : activePayment.status === "PAYMENT_CONFIRMED" &&
                    !isAccreditationTerminal(activeAccreditationStatus) ? (
                    <ArrowPathIcon className="h-6 w-6 animate-spin text-slate-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900">
                      {activeAccreditationStatus ?? "PENDIENTE"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {getAccreditationStatusMessage(
                        activePayment.status,
                        activeAccreditationStatus,
                      )}
                    </p>
                    {"txHash" in activePayment && activePayment.txHash ? (
                      <p className="mt-2 break-all font-mono text-xs text-slate-500">
                        {activePayment.txHash}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNewRecharge}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Nueva recarga
              </button>
            </aside>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">Últimos pagos</h2>
            <button
              type="button"
              onClick={() => void historyQuery.refetch()}
              disabled={historyQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${historyQuery.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Actualizar
            </button>
          </div>
          {historyQuery.error ? (
            <p className="mt-3 text-sm text-amber-700">
              No pudimos cargar el historial de pagos.
            </p>
          ) : null}
          {historyQuery.data?.items.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Pago</th>
                    <th className="px-3 py-2">Acreditación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyQuery.data.items.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td className="px-3 py-3 text-slate-600">
                        {formatDateTime(payment.createdAt)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        Bs. {payment.amount}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{payment.status}</td>
                      <td className="px-3 py-3 text-slate-700">
                        {payment.accreditationStatus ?? "PENDIENTE"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Aún no existen pagos de recarga para esta cuenta.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
