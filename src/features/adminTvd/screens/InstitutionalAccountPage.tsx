"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Modal2 from "@/components/Modal2";
import {
  selectAuth,
  updateActiveTenantWalletState,
} from "@/store/auth/authSlice";
import {
  InstitutionalAdminInvitation,
  InstitutionalApplication,
  useApproveInstitutionalApplicationMutation,
  useCancelInstitutionalAdminInvitationMutation,
  useCreateInstitutionalAdminInvitationMutation,
  useGetInstitutionalAdminInvitationsQuery,
  useGetInstitutionalApplicationsQuery,
  useRejectInstitutionalApplicationMutation,
  useResendInstitutionalAdminInvitationMutation,
} from "@/store/accessApprovals/accessApprovalsEndpoints";
import {
  TenantAdminAssignment,
  useListTenantAdminsQuery,
  useTransferTenantPrimaryMutation,
  useUpdateTenantAdminStatusMutation,
} from "@/store/institutionalTenants";
import { useCreateAdminEmailChangeRequestMutation } from "@/store/institutionalRecovery";
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
const PERSON_NOT_REGISTERED_MESSAGE =
  "La persona debe registrarse primero en Tu Voto Decide.";
const PERSON_WITHOUT_WALLET_MESSAGE =
  "La persona debe registrar primero su billetera en Tu Voto Decide.";
const ALREADY_ADMIN_MESSAGE = "Esta persona ya administra la institución.";
const DUPLICATE_INVITATION_MESSAGE =
  "Ya existe una invitación pendiente para esta persona.";
const EXISTING_ACCOUNT_MESSAGE =
  "Ya tienes una cuenta registrada. Inicia sesión con tu correo actual.";
const SERVICE_UNAVAILABLE_MESSAGE =
  "El servicio está temporalmente no disponible. Vuelve a intentar.";
const EMAIL_ALREADY_USED_MESSAGE =
  "El correo indicado ya pertenece a otra cuenta.";
const EMAIL_CHANGE_PENDING_MESSAGE =
  "Ya tienes un cambio de correo pendiente de revisión.";

const getErrorStatus = (error: unknown) =>
  typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: unknown }).status
    : undefined;

const getErrorText = (error: unknown) => {
  const data =
    typeof error === "object" && error !== null && "data" in error
      ? (error as { data?: any }).data
      : undefined;
  const message = data?.message ?? data?.error ?? "";
  return Array.isArray(message) ? message.join(" ") : String(message);
};

const getInvitationErrorMessage = (error: unknown) => {
  const status = getErrorStatus(error);
  const message = getErrorText(error).toLowerCase();
  if (status === 400 && message.includes("registrarse primero")) {
    return PERSON_NOT_REGISTERED_MESSAGE;
  }
  if (status === 400 && message.includes("billetera")) {
    return PERSON_WITHOUT_WALLET_MESSAGE;
  }
  if (status === 409 && message.includes("ya administra")) {
    return ALREADY_ADMIN_MESSAGE;
  }
  if (status === 409 && message.includes("invitación pendiente")) {
    return DUPLICATE_INVITATION_MESSAGE;
  }
  if (status === 409 && message.includes("cuenta")) {
    return EXISTING_ACCOUNT_MESSAGE;
  }
  if (status === 503 || status === 504) {
    return SERVICE_UNAVAILABLE_MESSAGE;
  }
  return getErrorText(error) || "No se pudo completar la acción. Vuelve a intentar.";
};

const getEmailChangeErrorMessage = (error: unknown) => {
  const status = getErrorStatus(error);
  const message = getErrorText(error).toLowerCase();
  if (status === 400 || message.includes("correo invalido")) {
    return "Ingresa un correo válido.";
  }
  if (status === 409 && message.includes("pertenece a otra cuenta")) {
    return EMAIL_ALREADY_USED_MESSAGE;
  }
  if (status === 409 && message.includes("pendiente")) {
    return EMAIL_CHANGE_PENDING_MESSAGE;
  }
  if (status === 409 && message.includes("distinto")) {
    return "El nuevo correo debe ser distinto del correo actual.";
  }
  if (status === 503 || status === 504) {
    return SERVICE_UNAVAILABLE_MESSAGE;
  }
  return getErrorText(error) || "No se pudo solicitar el cambio. Vuelve a intentar.";
};

const invitationStatusLabel = (status?: InstitutionalAdminInvitation["status"]) => {
  switch (status) {
    case "ACCEPTED":
      return "Aceptada";
    case "REJECTED":
      return "Rechazada";
    case "EXPIRED":
      return "Vencida";
    case "CANCELLED":
      return "Cancelada";
    default:
      return "Pendiente";
  }
};

const applicationStatusLabel = (status?: InstitutionalApplication["status"]) => {
  switch (status) {
    case "PENDING_MOBILE_AUTHORIZATION":
      return "Pendiente de firma en tu teléfono";
    case "MOBILE_AUTHORIZATION_EXPIRED":
      return "Vencida";
    case "PENDING_CHAIN_CONFIRMATION":
    case "RECONCILIATION_PENDING":
      return "Procesando autorización";
    case "CHAIN_RETRY_PENDING":
    case "CHAIN_FAILED":
      return "Error recuperable";
    case "APPROVED":
      return "Acceso habilitado";
    case "REJECTED":
      return "Rechazada";
    case "REVOKED":
      return "Acceso eliminado";
    default:
      return "Pendiente de revisión";
  }
};

const adminStatusLabel = (admin: TenantAdminAssignment) => {
  if (!admin.active && admin.status === "PENDING") return "Pendiente";
  if (!admin.active && admin.status === "SUSPENDED") return "Acceso suspendido";
  if (admin.active) return "Acceso habilitado";
  if (admin.status === "REVOKED") return "Acceso eliminado";
  if (admin.status === "REJECTED") return "Rechazada";
  return "Pendiente";
};

const roleLabel = (role?: string) =>
  role === "PRIMARY" ? "Administrador principal" : "Administrador de la institución";

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
  onSubmit: (payload: { dni: string }) => Promise<void>;
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
      await onSubmit({ dni: normalizedDni });
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
              setAccountAddress("");
              setResolutionStatus("pending");
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

function AddAccountModal({
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
  onSubmit: (payload: { dni: string }) => Promise<void>;
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
          setResolutionStatus(
            response.reason === "WALLET_NOT_FOUND" ? "not_found" : "error",
          );
          setLocalError(
            response.reason === "WALLET_NOT_FOUND"
              ? PERSON_WITHOUT_WALLET_MESSAGE
              : PERSON_NOT_REGISTERED_MESSAGE,
          );
        })
        .catch((error) => {
          if (lastRequestedDniRef.current !== normalizedDni) return;
          setAccountAddress("");
          const status = getWalletResolutionStatus(error);
          setResolutionStatus(status);
          const message = getErrorText(error).toLowerCase();
          if (message.includes("registrarse primero")) {
            setLocalError(PERSON_NOT_REGISTERED_MESSAGE);
            return;
          }
          if (message.includes("billetera")) {
            setLocalError(PERSON_WITHOUT_WALLET_MESSAGE);
            return;
          }
          setLocalError(
            status === "rate_limited"
              ? WALLET_RATE_LIMIT_MESSAGE
              : SERVICE_UNAVAILABLE_MESSAGE,
          );
        });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [isDniValid, isOpen, normalizedDni, resolveWallet]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDniValid) {
      setLocalError("Ingresa un CI o carnet válido.");
      return;
    }
    if (resolutionStatus !== "found" || !accountAddress) {
      setLocalError("Primero debe resolverse la billetera registrada.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit({ dni: normalizedDni });
      setDni("");
      setAccountAddress("");
      setResolutionStatus("pending");
    } catch {
      // El mensaje seguro del backend se muestra en la vista del modal.
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

  const canSubmit =
    isDniValid && resolutionStatus === "found" && Boolean(accountAddress) && !isLoading;

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar cuenta"
      type="plain"
      size="md"
      closeOnEscape={!isLoading}
      className="sm:rounded-2xl max-sm:mt-auto max-sm:rounded-b-none"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Institución activa: <span className="font-semibold">{tenantName}</span>.
          La invitación no habilita acceso hasta completar revisión, firma y confirmación.
        </div>

        <div>
          <label
            htmlFor="invite-dni"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            CI o carnet
          </label>
          <input
            id="invite-dni"
            value={dni}
            onChange={(event) => {
              setDni(event.target.value);
              setAccountAddress("");
              setResolutionStatus("pending");
              setLocalError(null);
            }}
            placeholder="12345678"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Billetera registrada
          </label>
          <div className="min-h-[46px] break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700">
            {accountAddress || WALLET_PENDING_MESSAGE}
          </div>
          <p
            className={`mt-2 text-sm font-medium ${
              localError ? "text-red-600" : "text-slate-500"
            }`}
            role={localError ? "alert" : "status"}
          >
            {localError ||
              (resolutionStatus === "loading"
                ? WALLET_LOADING_MESSAGE
                : resolutionStatus === "found"
                  ? "Billetera resuelta por el sistema de identidad."
                  : "Ingresa el CI o carnet para resolver la persona.")}
          </p>
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
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
            )}
            Agregar
          </button>
        </div>
      </form>
    </Modal2>
  );
}

function TransferPrimaryModal({
  isOpen,
  tenantName,
  currentPrimary,
  target,
  isLoading,
  errorMessage,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  tenantName: string;
  currentPrimary: TenantAdminAssignment | null;
  target: TenantAdminAssignment | null;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!target) return null;
  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title="Transferir rol principal"
      type="plain"
      size="md"
      closeOnEscape={!isLoading}
      className="sm:rounded-2xl max-sm:mt-auto max-sm:rounded-b-none"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La transferencia requerirá confirmación desde tu teléfono. Los roles no cambian
          hasta que la red confirme la operación.
        </div>
        <div className="grid gap-3 text-sm">
          <div>
            <p className="text-slate-500">Institución</p>
            <p className="font-semibold text-slate-900">{tenantName}</p>
          </div>
          <div>
            <p className="text-slate-500">Administrador principal actual</p>
            <p className="font-semibold text-slate-900">
              {currentPrimary?.name || currentPrimary?.email || "Administrador principal"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Persona destino</p>
            <p className="font-semibold text-slate-900">
              {target.name || target.email || "Administrador de la institución"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Billetera destino</p>
            <p className="break-all font-mono text-xs font-semibold text-slate-900">
              {target.accountAddress}
            </p>
          </div>
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
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
            )}
            Confirmar transferencia
          </button>
        </div>
      </div>
    </Modal2>
  );
}

function EmailChangeModal({
  isOpen,
  currentEmail,
  isLoading,
  errorMessage,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  currentEmail: string;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: { newEmail: string }) => Promise<void>;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const normalizedCurrentEmail = currentEmail.trim().toLowerCase();
  const normalizedNewEmail = newEmail.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const canSubmit =
    Boolean(normalizedNewEmail) &&
    emailPattern.test(normalizedNewEmail) &&
    normalizedNewEmail !== normalizedCurrentEmail &&
    !isLoading;

  useEffect(() => {
    if (!isOpen) {
      setNewEmail("");
      setLocalError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailPattern.test(normalizedNewEmail)) {
      setLocalError("Ingresa un correo válido.");
      return;
    }
    if (normalizedNewEmail === normalizedCurrentEmail) {
      setLocalError("El nuevo correo debe ser distinto del correo actual.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit({ newEmail: normalizedNewEmail });
      setNewEmail("");
    } catch {
      // La mutación expone el mensaje seguro arriba.
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitar cambio de correo"
      type="plain"
      size="md"
      closeOnEscape={!isLoading}
      className="sm:rounded-2xl max-sm:mt-auto max-sm:rounded-b-none"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          El cambio queda pendiente de revisión por Superadmin. No se modifica
          tu contraseña, CI, wallet, roles ni instituciones.
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Correo actual
          </label>
          <div className="min-h-[46px] break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            {currentEmail || "No informado"}
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-email-change-new-email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Nuevo correo
          </label>
          <input
            id="admin-email-change-new-email"
            value={newEmail}
            onChange={(event) => {
              setNewEmail(event.target.value);
              setLocalError(null);
            }}
            type="email"
            placeholder="admin@institucion.bo"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
            disabled={isLoading}
            autoComplete="email"
          />
          {localError ? (
            <p className="mt-2 text-sm font-medium text-red-600" role="alert">
              {localError}
            </p>
          ) : null}
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
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : null}
            Solicitar cambio
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
  const {
    data: adminsResponse,
    isFetching: isAdminsFetching,
    refetch: refetchAdmins,
  } = useListTenantAdminsQuery(tenantId ?? "", { skip: !tenantId });
  const {
    data: invitations = [],
    isFetching: isInvitationsFetching,
    refetch: refetchInvitations,
  } = useGetInstitutionalAdminInvitationsQuery(tenantId ?? "", {
    skip: !tenantId,
  });
  const {
    data: applications = [],
    isFetching: isApplicationsFetching,
    refetch: refetchApplications,
  } = useGetInstitutionalApplicationsQuery(undefined, { skip: !tenantId });
  const [
    createInvitation,
    { isLoading: isCreatingInvitation, error: createInvitationError, reset: resetCreateInvitation },
  ] = useCreateInstitutionalAdminInvitationMutation();
  const [resendInvitation] = useResendInstitutionalAdminInvitationMutation();
  const [cancelInvitation] = useCancelInstitutionalAdminInvitationMutation();
  const [updateAdminStatus] = useUpdateTenantAdminStatusMutation();
  const [
    transferTenantPrimary,
    { isLoading: isTransferringPrimary, error: transferPrimaryError, reset: resetTransferPrimary },
  ] = useTransferTenantPrimaryMutation();
  const [approveApplication] = useApproveInstitutionalApplicationMutation();
  const [rejectApplication] = useRejectInstitutionalApplicationMutation();
  const [
    createEmailChangeRequest,
    {
      isLoading: isRequestingEmailChange,
      error: emailChangeError,
      reset: resetEmailChangeRequest,
    },
  ] = useCreateAdminEmailChangeRequestMutation();
  const visualBalance = useTvdVisualBalance(
    summary?.wallet,
    summary?.contractAddress,
    summary?.chainId,
    tenantContextKey,
  );

  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] =
    useState<TenantAdminAssignment | null>(null);

  const admins = adminsResponse?.data ?? [];
  const isPrimaryAdmin = useMemo(
    () =>
      admins.some(
        (admin) =>
          String(admin.userId) === String(auth.user?.id ?? "") &&
          admin.institutionalRole === "PRIMARY" &&
          admin.status === "APPROVED" &&
          admin.active,
      ),
    [admins, auth.user?.id],
  );
  const currentPrimary = useMemo(
    () =>
      admins.find(
        (admin) =>
          admin.institutionalRole === "PRIMARY" &&
          admin.status === "APPROVED" &&
          admin.active,
      ) ?? null,
    [admins],
  );
  const tenantApplications = useMemo(
    () =>
      applications.filter((application) => {
        if (!tenantId || application.tenantId !== tenantId) return false;
        return [
          "PENDING_APPROVAL",
          "PENDING_MOBILE_AUTHORIZATION",
          "MOBILE_AUTHORIZATION_EXPIRED",
          "PENDING_CHAIN_CONFIRMATION",
          "CHAIN_RETRY_PENDING",
          "RECONCILIATION_PENDING",
          "CHAIN_FAILED",
          "APPROVED",
          "REJECTED",
        ].includes(application.status ?? "PENDING_APPROVAL");
      }),
    [applications, tenantId],
  );
  const isInstitutionalDataLoading =
    isAdminsFetching || isInvitationsFetching || isApplicationsFetching;

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

  const handleRegularize = async (payload: { dni: string }) => {
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

  const handleCreateInvitation = async (payload: { dni: string }) => {
    if (!tenantId || isCreatingInvitation) return;
    setActionError(null);
    try {
      await createInvitation({ tenantId, dni: payload.dni }).unwrap();
      setFeedback("Invitación creada. La cuenta queda Pendiente.");
      setAddAccountOpen(false);
      resetCreateInvitation();
      await refetchInvitations();
    } catch (error) {
      setActionError(getInvitationErrorMessage(error));
      throw error;
    }
  };

  const handleEmailChangeRequest = async (payload: { newEmail: string }) => {
    await createEmailChangeRequest(payload).unwrap();
    setFeedback("Cambio de correo solicitado. Queda pendiente de revisión.");
    setEmailChangeOpen(false);
    resetEmailChangeRequest();
  };

  const handleUpdateAdminStatus = async (admin: TenantAdminAssignment, active: boolean) => {
    if (!tenantId || !admin.assignmentId) return;
    await updateAdminStatus({
      tenantId,
      assignmentId: admin.assignmentId,
      data: {
        active,
        reason: active
          ? "Reactivación desde Cuenta institucional"
          : "Suspensión temporal desde Cuenta institucional",
      },
    }).unwrap();
    setFeedback(
      active
        ? "Acceso habilitado. No se pidió firma ni operación en la red."
        : "Acceso suspendido. La billetera permanece autorizada.",
    );
  };

  const handleTransferPrimary = async () => {
    if (!tenantId || !transferTarget?.assignmentId || isTransferringPrimary) return;
    setActionError(null);
    try {
      await transferTenantPrimary({
        tenantId,
        data: {
          assignmentId: transferTarget.assignmentId,
          reason: "Transferencia iniciada desde Cuenta institucional",
        },
      }).unwrap();
      setFeedback("Transferencia pendiente de firma en tu teléfono.");
      setTransferTarget(null);
      resetTransferPrimary();
      await Promise.all([refetchApplications(), refetchAdmins()]);
    } catch (error) {
      setActionError(getInvitationErrorMessage(error));
      throw error;
    }
  };

  const runRowAction = async (key: string, action: () => Promise<unknown>) => {
    if (pendingActionKey) return;
    setPendingActionKey(key);
    setActionError(null);
    try {
      await action();
      await Promise.all([refetchInvitations(), refetchApplications(), refetchAdmins()]);
    } catch (error) {
      setActionError(getInvitationErrorMessage(error));
    } finally {
      setPendingActionKey(null);
    }
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
          <div className="flex flex-wrap gap-2">
            {isPrimaryAdmin ? (
              <button
                type="button"
                onClick={() => {
                  resetCreateInvitation();
                  setActionError(null);
                  setAddAccountOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#459151] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#3a7a44]"
              >
                <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
                Agregar cuenta
              </button>
            ) : null}
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

        {actionError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {actionError}
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
              <p className="mt-1 text-sm text-slate-500">
                Correo actual: {auth.user?.email || "No informado"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  resetEmailChangeRequest();
                  setEmailChangeOpen(true);
                }}
                className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cambiar correo
              </button>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#2E6A38] ring-1 ring-green-200">
                <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                Institución activa
              </span>
            </div>
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
                    <p className="text-slate-500">Relación institucional</p>
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

          <div className="mt-6 space-y-5">
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Administradores y cuentas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Cuentas activas y pendientes de esta institución.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                  {admins.length} cuenta{admins.length === 1 ? "" : "s"}
                </span>
              </div>

              {isInstitutionalDataLoading ? (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Cargando cuentas institucionales...
                </div>
              ) : admins.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {admins.map((admin) => (
                    <article
                      key={admin.assignmentId ?? `${admin.tenantId}-${admin.userId}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {admin.name || admin.email || "Administrador institucional"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {roleLabel(admin.institutionalRole)}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                          {adminStatusLabel(admin)}
                        </span>
                      </div>
                      {admin.accountAddress ? (
                        <p className="mt-3 break-all font-mono text-xs text-slate-600">
                          {admin.accountAddress}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-amber-700">
                          Billetera pendiente de registrar.
                        </p>
                      )}

                      {isPrimaryAdmin &&
                      admin.assignmentId &&
                      admin.institutionalRole === "SECONDARY" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {admin.active && admin.status === "APPROVED" ? (
                            <button
                              type="button"
                              disabled={pendingActionKey === "suspend:" + admin.assignmentId}
                              onClick={() =>
                                void runRowAction("suspend:" + admin.assignmentId, () =>
                                  handleUpdateAdminStatus(admin, false),
                                )
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Suspender
                            </button>
                          ) : null}
                          {admin.active && admin.status === "APPROVED" && admin.accountAddress ? (
                            <button
                              type="button"
                              disabled={Boolean(pendingActionKey) || isTransferringPrimary}
                              onClick={() => {
                                resetTransferPrimary();
                                setActionError(null);
                                setTransferTarget(admin);
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Transferir rol principal
                            </button>
                          ) : null}
                          {!admin.active && admin.status === "SUSPENDED" ? (
                            <button
                              type="button"
                              disabled={pendingActionKey === "reactivate:" + admin.assignmentId}
                              onClick={() =>
                                void runRowAction("reactivate:" + admin.assignmentId, () =>
                                  handleUpdateAdminStatus(admin, true),
                                )
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-bold text-[#2E6A38] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reactivar
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No hay cuentas visibles para esta institución.
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Invitaciones enviadas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Historial de invitaciones enviadas por el administrador principal.
                  </p>
                </div>
                {isPrimaryAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetCreateInvitation();
                      setActionError(null);
                      setAddAccountOpen(true);
                    }}
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                    Agregar cuenta
                  </button>
                ) : null}
              </div>

              {invitations.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {invitations.map((invitation) => {
                    const isPending = invitation.status === "PENDING";
                    const resendKey = `resend:${invitation.id}`;
                    const cancelKey = `cancel:${invitation.id}`;
                    return (
                      <article
                        key={invitation.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {invitation.name || `CI ${invitation.dni}`}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              CI o carnet: {invitation.dni}
                            </p>
                          </div>
                          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                            {invitationStatusLabel(invitation.status)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          Vence: {formatDate(invitation.expiresAt)}
                        </p>
                        {isPrimaryAdmin && isPending ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={Boolean(pendingActionKey)}
                              onClick={() =>
                                void runRowAction(resendKey, async () => {
                                  await resendInvitation(invitation.id).unwrap();
                                  setFeedback("Aviso reenviado sin crear otra invitación.");
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                              Reenviar
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(pendingActionKey)}
                              onClick={() =>
                                void runRowAction(cancelKey, async () => {
                                  await cancelInvitation({ invitationId: invitation.id }).unwrap();
                                  setFeedback("Invitación cancelada. El historial se conserva.");
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircleIcon className="h-4 w-4" aria-hidden="true" />
                              Cancelar
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  Todavía no hay invitaciones enviadas.
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Solicitudes de acceso recibidas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Personas que pidieron acceso a esta institución.
                </p>
              </div>

              {tenantApplications.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {tenantApplications.map((application) => {
                    const canReview =
                      isPrimaryAdmin && application.status === "PENDING_APPROVAL";
                    const approveKey = `approve:${application.id}`;
                    const rejectKey = `reject:${application.id}`;
                    return (
                      <article
                        key={application.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {application.name || application.email || "Solicitante"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {application.email || application.dni || tenantName}
                            </p>
                          </div>
                          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                            {applicationStatusLabel(application.status)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          Institución: {application.institutionName || tenantName}
                        </p>
                        {canReview ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={Boolean(pendingActionKey)}
                              onClick={() =>
                                void runRowAction(approveKey, async () => {
                                  await approveApplication(application.id).unwrap();
                                  setFeedback("Solicitud pendiente de firma en tu teléfono.");
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-[#459151] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                              Aprobar
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(pendingActionKey)}
                              onClick={() =>
                                void runRowAction(rejectKey, async () => {
                                  await rejectApplication({
                                    applicationId: application.id,
                                    reason: "Rechazada desde Cuenta institucional",
                                  }).unwrap();
                                  setFeedback("Solicitud rechazada. No se creó firma pendiente.");
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircleIcon className="h-4 w-4" aria-hidden="true" />
                              Rechazar
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No hay solicitudes de acceso recibidas.
                </div>
              )}
            </section>
          </div>

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
      <AddAccountModal
        isOpen={addAccountOpen}
        tenantName={tenantName}
        isLoading={isCreatingInvitation}
        errorMessage={
          createInvitationError
            ? getInvitationErrorMessage(createInvitationError)
            : actionError
        }
        onClose={() => {
          resetCreateInvitation();
          setActionError(null);
          setAddAccountOpen(false);
        }}
        onSubmit={handleCreateInvitation}
      />
      <EmailChangeModal
        isOpen={emailChangeOpen}
        currentEmail={auth.user?.email ?? ""}
        isLoading={isRequestingEmailChange}
        errorMessage={
          emailChangeError ? getEmailChangeErrorMessage(emailChangeError) : null
        }
        onClose={() => {
          if (isRequestingEmailChange) return;
          resetEmailChangeRequest();
          setEmailChangeOpen(false);
        }}
        onSubmit={handleEmailChangeRequest}
      />
      <TransferPrimaryModal
        isOpen={Boolean(transferTarget)}
        tenantName={tenantName}
        currentPrimary={currentPrimary}
        target={transferTarget}
        isLoading={isTransferringPrimary}
        errorMessage={
          transferPrimaryError
            ? getInvitationErrorMessage(transferPrimaryError)
            : actionError
        }
        onClose={() => {
          if (isTransferringPrimary) return;
          resetTransferPrimary();
          setActionError(null);
          setTransferTarget(null);
        }}
        onConfirm={handleTransferPrimary}
      />
    </div>
  );
}
