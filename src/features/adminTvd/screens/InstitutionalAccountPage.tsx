"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Modal2 from "@/components/Modal2";
import {
  selectAuth,
  updateActiveTenantWalletState,
} from "@/store/auth/authSlice";
import { useResolveInstitutionalWalletByDniMutation } from "@/store/institutionalWallets";
import {
  useGetMyTvdSummaryQuery,
  useRegularizeMyInstitutionalWalletMutation,
} from "@/store/tvd";
import { copyTextToClipboard } from "../services/clipboard";
import { useTvdVisualBalance } from "../hooks/useTvdVisualBalance";
import {
  formatTvdDisplay,
  getRegularizationErrorMessage,
  getSummaryErrorMessage,
  isWalletUpdateRequiredError,
  shortWalletAddress,
  validateInstitutionalWalletAddress,
} from "../utils/institutionalWalletUi";

type WalletResolutionStatus =
  | "pending"
  | "loading"
  | "found"
  | "not_found"
  | "rate_limited"
  | "error";

const DNI_PATTERN = /^[A-Za-z0-9-]{5,20}$/;
const WALLET_PENDING_MESSAGE = "Wallet pendiente de consultar";
const WALLET_LOADING_MESSAGE = "Buscando billetera registrada...";
const WALLET_NOT_FOUND_MESSAGE =
  "No se encontró una billetera registrada para este carnet. Debe registrarse primero en la aplicación móvil.";
const WALLET_RATE_LIMIT_MESSAGE =
  "Se realizaron demasiados intentos. Intente nuevamente más tarde.";
const WALLET_LOOKUP_ERROR_MESSAGE =
  "No fue posible consultar la billetera en este momento. Intente nuevamente.";

const getWalletResolutionStatus = (error: unknown): WalletResolutionStatus => {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === 429) return "rate_limited";
  }
  return "error";
};

const getWalletResolutionMessage = (
  status: WalletResolutionStatus,
  accountAddress: string,
) => {
  if (status === "loading") return WALLET_LOADING_MESSAGE;
  if (status === "found") return accountAddress;
  if (status === "not_found") return WALLET_NOT_FOUND_MESSAGE;
  if (status === "rate_limited") return WALLET_RATE_LIMIT_MESSAGE;
  if (status === "error") return WALLET_LOOKUP_ERROR_MESSAGE;
  return WALLET_PENDING_MESSAGE;
};

function RegularizationModal({
  isOpen,
  tenantName,
  isLoading,
  errorMessage,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  tenantName: string;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: { dni: string; accountAddress: string }) => Promise<void>;
}) {
  const [resolveWallet] = useResolveInstitutionalWalletByDniMutation();
  const lastRequestedDniRef = useRef("");
  const [dni, setDni] = useState("");
  const [accountAddress, setAccountAddress] = useState("");
  const [resolutionStatus, setResolutionStatus] =
    useState<WalletResolutionStatus>("pending");
  const [localError, setLocalError] = useState<string | null>(null);
  const normalizedDni = dni.trim();
  const isDniValid = DNI_PATTERN.test(normalizedDni);

  useEffect(() => {
    setAccountAddress("");
    setLocalError(null);

    if (!isOpen) {
      setDni("");
      lastRequestedDniRef.current = "";
      setResolutionStatus("pending");
      return;
    }
    if (!isDniValid) {
      lastRequestedDniRef.current = "";
      setResolutionStatus("pending");
      return;
    }

    setResolutionStatus("pending");
    const timer = window.setTimeout(() => {
      if (lastRequestedDniRef.current === normalizedDni) return;
      lastRequestedDniRef.current = normalizedDni;
      setResolutionStatus("loading");
      resolveWallet({ dni: normalizedDni })
        .unwrap()
        .then((response) => {
          if (lastRequestedDniRef.current !== normalizedDni) return;
          if (response.registered && response.accountAddress) {
            setAccountAddress(response.accountAddress);
            setResolutionStatus("found");
            return;
          }
          setAccountAddress("");
          setResolutionStatus("not_found");
        })
        .catch((error) => {
          if (lastRequestedDniRef.current !== normalizedDni) return;
          setAccountAddress("");
          setResolutionStatus(getWalletResolutionStatus(error));
        });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [isDniValid, isOpen, normalizedDni, resolveWallet]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDniValid) {
      setLocalError("Carnet inválido");
      return;
    }
    const validation = validateInstitutionalWalletAddress(accountAddress);
    if (!validation.valid) {
      setLocalError(
        resolutionStatus === "not_found"
          ? WALLET_NOT_FOUND_MESSAGE
          : "Debes resolver la wallet antes de vincularla.",
      );
      return;
    }
    setLocalError(null);
    try {
      await onSubmit({ dni: normalizedDni, accountAddress: validation.normalized });
    } catch {
      // The mutation state renders the safe backend error message.
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setDni("");
    setAccountAddress("");
    setResolutionStatus("pending");
    setLocalError(null);
    onClose();
  };

  const resolutionMessage = getWalletResolutionMessage(
    resolutionStatus,
    accountAddress,
  );
  const isResolutionError =
    resolutionStatus === "not_found" ||
    resolutionStatus === "rate_limited" ||
    resolutionStatus === "error";

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Vincular wallet institucional"
      type="plain"
      size="md"
      closeOnEscape={!isLoading}
      className="sm:rounded-2xl max-sm:mt-auto max-sm:rounded-b-none"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tu cuenta institucional necesita vincular la wallet creada en la
          aplicación móvil antes de operar con TVD.
        </div>

        <div>
          <label
            htmlFor="regularization-dni"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Carnet de identidad
          </label>
          <input
            id="regularization-dni"
            value={dni}
            onChange={(event) => {
              setDni(event.target.value);
              setLocalError(null);
            }}
            placeholder="12345678"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="regularization-wallet"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Wallet registrada
          </label>
          <input
            id="regularization-wallet"
            value={accountAddress}
            readOnly
            placeholder={WALLET_PENDING_MESSAGE}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 outline-none"
          />
          <p
            className={`mt-2 text-sm font-medium ${
              isResolutionError ? "text-red-600" : "text-slate-500"
            }`}
            role={isResolutionError ? "alert" : "status"}
          >
            {resolutionMessage}
          </p>
          {localError ? (
            <p className="mt-2 text-sm font-medium text-red-600" role="alert">
              {localError}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Institución activa: <span className="font-semibold">{tenantName}</span>.
          La wallet debe pertenecer al usuario autenticado y no reemplaza una
          wallet ya verificada.
        </div>

        {errorMessage ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !accountAddress}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : null}
            Vincular wallet
          </button>
        </div>
      </form>
    </Modal2>
  );
}

export default function InstitutionalAccountPage() {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const tenantId = auth.activeContext?.tenantId ?? auth.user?.tenantId ?? null;
  const tenantName =
    auth.activeContext?.tenantName ?? auth.user?.tenantName ?? "Institución";
  const tenantContextKey = [
    auth.activeContext?.type ?? "",
    tenantId ?? "",
    auth.user?.id ?? "",
  ].join(":");

  const {
    data: summary,
    error: summaryError,
    isFetching: isSummaryFetching,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetMyTvdSummaryQuery({ tenantId }, { skip: !tenantId });
  const [
    regularizeWallet,
    {
      isLoading: isRegularizing,
      error: regularizationError,
      reset: resetRegularization,
    },
  ] = useRegularizeMyInstitutionalWalletMutation();
  const visualBalance = useTvdVisualBalance(
    summary?.wallet,
    summary?.contractAddress,
    summary?.chainId,
    tenantContextKey,
  );

  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const requiresWalletUpdate = useMemo(() => {
    if (summary?.walletStatus === "VERIFIED") return false;
    if (summaryError) return isWalletUpdateRequiredError(summaryError);
    return false;
  }, [summary?.walletStatus, summaryError]);

  const handleCopy = async () => {
    if (!summary?.wallet) return;
    const copied = await copyTextToClipboard(summary.wallet);
    setCopyFeedback(copied ? "Dirección copiada." : "No se pudo copiar la dirección.");
  };

  const handleRegularize = async (payload: {
    dni: string;
    accountAddress: string;
  }) => {
    if (!tenantId) return;
    const response = await regularizeWallet({
      tenantId,
      body: payload,
    }).unwrap();
    dispatch(
      updateActiveTenantWalletState({
        tenantId,
        hasWallet: response.hasWallet,
        requiresWalletUpdate: response.requiresWalletUpdate,
        walletStatus: response.walletStatus,
      }),
    );
    setFeedback("Wallet institucional vinculada correctamente.");
    setRegularizationOpen(false);
    resetRegularization();
    await refetchSummary();
    await visualBalance.refetch();
  };

  const balanceErrorMessage = visualBalance.error
    ? "No pudimos consultar el saldo actual. Las operaciones seguirán validándose en backend."
    : null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Cuenta institucional
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Operas con la wallet vinculada a tu usuario y contexto institucional activo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetchSummary()}
            disabled={isSummaryFetching}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${isSummaryFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Actualizar cuenta
          </button>
        </div>

        {!tenantId ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No existe un contexto institucional activo.
          </div>
        ) : null}

        {feedback ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-[#2E6A38]">
            {feedback}
          </div>
        ) : null}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Institución activa
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{tenantName}</h2>
              <p className="mt-2 text-sm text-slate-500">
                Usuario: {auth.user?.name || auth.user?.email || "Administrador institucional"}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#2E6A38] ring-1 ring-green-200">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              Contexto TENANT
            </span>
          </div>

          {isSummaryLoading ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Cargando cuenta institucional...
            </div>
          ) : summary ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Wallet activa
                    </p>
                    <p className="mt-2 break-all font-mono text-base font-bold text-slate-900">
                      {summary.wallet}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {shortWalletAddress(summary.wallet)}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#2E6A38] ring-1 ring-green-200">
                    Verificada
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Assignment</p>
                    <p className="break-all font-mono text-slate-800">
                      {summary.assignmentId}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Estado</p>
                    <p className="font-semibold text-slate-800">
                      {summary.walletStatus}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                    Copiar
                  </button>
                </div>
                {copyFeedback ? (
                  <p className="mt-2 text-sm font-medium text-[#2E6A38]">
                    {copyFeedback}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Saldo TVD visual
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lectura directa de blockchain, solo informativa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void visualBalance.refetch()}
                    disabled={visualBalance.isLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowPathIcon
                      className={`h-4 w-4 ${
                        visualBalance.isLoading ? "animate-spin" : ""
                      }`}
                      aria-hidden="true"
                    />
                    Actualizar saldo
                  </button>
                </div>

                {visualBalance.isLoading ? (
                  <div
                    className="mt-5 rounded-lg bg-slate-50 px-4 py-6 text-sm text-slate-500"
                    role="status"
                  >
                    Consultando saldo en blockchain...
                  </div>
                ) : visualBalance.data ? (
                  <div className="mt-5 space-y-3">
                    <div>
                      <p className="text-3xl font-bold text-slate-900">
                        {formatTvdDisplay(visualBalance.data.totalBalanceFormatted)} TVD
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Última actualización:{" "}
                        {new Date(visualBalance.data.readAt).toLocaleString("es-BO")}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Líquido</p>
                        <p className="font-semibold text-slate-800">
                          {formatTvdDisplay(visualBalance.data.liquidBalanceFormatted)} TVD
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Asignado</p>
                        <p className="font-semibold text-slate-800">
                          {formatTvdDisplay(visualBalance.data.assignedBalanceFormatted)} TVD
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {balanceErrorMessage ??
                      "Configura la lectura pública TVD para consultar el saldo visual."}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    {getSummaryErrorMessage(summaryError)}
                  </p>
                  <p className="mt-1">
                    {requiresWalletUpdate
                      ? "La wallet debe estar registrada en la aplicación móvil y pertenecer al usuario autenticado."
                      : "Puedes reintentar la carga del resumen sin cambiar tu configuración institucional."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {requiresWalletUpdate ? (
                      <button
                        type="button"
                        onClick={() => setRegularizationOpen(true)}
                        className="rounded-lg bg-[#459151] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#3a7a44]"
                      >
                        Regularizar wallet
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void refetchSummary()}
                      className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                    >
                      Reintentar resumen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {summary?.walletStatus === "VERIFIED" ? (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-[#2E6A38]">
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p>
                  Esta cuenta opera únicamente con la wallet vinculada a tu usuario,
                  assignment y tenant activo. Las validaciones autoritativas se
                  realizan nuevamente en backend.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <RegularizationModal
        isOpen={regularizationOpen}
        tenantName={tenantName}
        isLoading={isRegularizing}
        errorMessage={
          regularizationError
            ? getRegularizationErrorMessage(regularizationError)
            : null
        }
        onClose={() => {
          resetRegularization();
          setRegularizationOpen(false);
        }}
        onSubmit={handleRegularize}
      />
    </div>
  );
}
