"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowPathIcon,
  CheckCircleIcon,
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
import { useResolveInstitutionalWalletByDniMutation } from "@/store/institutionalWallets";
import {
  useGetMyTvdSummaryQuery,
  useRegularizeMyInstitutionalWalletMutation,
} from "@/store/tvd";
import {
  getRegularizationErrorMessage,
  isWalletUpdateRequiredError,
  shortWalletAddress,
} from "../utils/institutionalWalletUi";

type WalletResolutionStatus =
  | "pending"
  | "loading"
  | "found"
  | "not_found"
  | "rate_limited"
  | "error";

const DNI_PATTERN = /^[A-Za-z0-9-]{5,20}$/;
const WALLET_PENDING_MESSAGE = "Ingresa el CI/DNI para validar la cuenta.";
const WALLET_LOADING_MESSAGE = "Buscando cuenta registrada...";
const WALLET_RATE_LIMIT_MESSAGE =
  "Se realizaron demasiados intentos. Intente nuevamente más tarde.";
const PERSON_NOT_REGISTERED_MESSAGE =
  "La persona no está registrada en Tu Voto Decide.";
const PERSON_WITHOUT_WALLET_MESSAGE =
  "No se encontró una cuenta registrada para esta persona.";
const ALREADY_ADMIN_MESSAGE = "Esta persona ya tiene una cuenta en la institución.";
const DUPLICATE_INVITATION_MESSAGE =
  "Ya existe una invitación pendiente para esta persona.";
const EXISTING_ACCOUNT_MESSAGE =
  "La cuenta ya se encuentra asociada a otra institución.";
const SERVICE_UNAVAILABLE_MESSAGE =
  "No pudimos validar la cuenta en este momento. Inténtalo nuevamente.";

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
  if (status === 400 && (message.includes("billetera") || message.includes("wallet"))) {
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
  if (!admin.active && admin.status === "SUSPENDED") return "Acceso suspendido";
  if (admin.active) return "Acceso habilitado";
  if (admin.status === "REVOKED") return "Acceso eliminado";
  if (admin.status === "REJECTED") return "Rechazada";
  return "No habilitado";
};

const normalizeAdminMatchValue = (value?: string | null) =>
  String(value ?? "").trim().toLowerCase();

const isApprovedActiveAdmin = (admin: TenantAdminAssignment) =>
  admin.active && admin.status === "APPROVED";

const isPrimaryInstitutionalRole = (role?: string | null) =>
  String(role ?? "").trim().toUpperCase() === "PRIMARY";

const getAdminDni = (admin: TenantAdminAssignment) =>
  (admin as TenantAdminAssignment & { dni?: string | null }).dni;

const roleLabel = (role?: string) =>
  isPrimaryInstitutionalRole(role)
    ? "Administrador principal"
    : "Administrador de la institución";

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

function RegularizationModal({
  isOpen,
  isLoading,
  errorMessage,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: { dni: string }) => Promise<void>;
}) {
  const [dni, setDni] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const normalizedDni = dni.trim();
  const isDniValid = DNI_PATTERN.test(normalizedDni);

  useEffect(() => {
    setLocalError(null);

    if (!isOpen) {
      setDni("");
      return;
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDniValid) {
      setLocalError("Ingresa un CI/DNI válido.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit({ dni: normalizedDni });
    } catch {
      // The mutation state renders the safe service error message.
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setDni("");
    setLocalError(null);
    onClose();
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Asociar mi cuenta"
      type="plain"
      size="md"
      closeOnEscape={!isLoading}
      className="sm:rounded-2xl max-sm:mt-auto max-sm:rounded-b-none"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Ingresa tu CI/DNI para buscar y asociar automáticamente la cuenta registrada para tu usuario.
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
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !isDniValid}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : null}
            Buscar y asociar
          </button>
        </div>
      </form>
    </Modal2>
  );
}

function AddAccountModal({
  isOpen,
  isLoading,
  errorMessage,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: { dni: string }) => Promise<void>;
}) {
  const [resolveWallet] = useResolveInstitutionalWalletByDniMutation();
  const lastRequestedDniRef = useRef("");
  const [dni, setDni] = useState("");
  const [resolutionStatus, setResolutionStatus] =
    useState<WalletResolutionStatus>("pending");
  const [localError, setLocalError] = useState<string | null>(null);
  const normalizedDni = dni.trim();
  const isDniValid = DNI_PATTERN.test(normalizedDni);

  useEffect(() => {
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
            setResolutionStatus("found");
            return;
          }
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
          const status = getWalletResolutionStatus(error);
          setResolutionStatus(status);
          const message = getErrorText(error).toLowerCase();
          if (message.includes("registrarse primero")) {
            setLocalError(PERSON_NOT_REGISTERED_MESSAGE);
            return;
          }
          if (message.includes("billetera") || message.includes("wallet")) {
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
    if (resolutionStatus !== "found") {
      setLocalError("Primero valida la cuenta con el CI/DNI ingresado.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit({ dni: normalizedDni });
      setDni("");
      setResolutionStatus("pending");
    } catch {
      // El mensaje seguro del servicio se muestra en la vista del modal.
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setDni("");
    setResolutionStatus("pending");
    setLocalError(null);
    onClose();
  };

  const canSubmit =
    isDniValid && resolutionStatus === "found" && !isLoading;

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Invitar administrador"
      type="plain"
      size="md"
      closeOnEscape={!isLoading}
      className="sm:rounded-2xl max-sm:mt-auto max-sm:rounded-b-none"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Ingresa el CI/DNI para validar la cuenta y usar el flujo de acceso disponible.
        </div>

        <div>
          <label
            htmlFor="invite-dni"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            CI/DNI
          </label>
          <input
            id="invite-dni"
            value={dni}
            onChange={(event) => {
              setDni(event.target.value);
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
            Estado de la cuenta
          </label>
          <p
            className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium ${
              localError ? "text-red-600" : "text-slate-500"
            }`}
            role={localError ? "alert" : "status"}
          >
            {localError ||
              (resolutionStatus === "loading"
                ? WALLET_LOADING_MESSAGE
                : resolutionStatus === "found"
                  ? "Cuenta encontrada. Puedes continuar."
                  : WALLET_PENDING_MESSAGE)}
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
            Invitar administrador
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
          hasta completar la confirmación.
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
            <p className="text-slate-500">Cuenta destino</p>
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

export default function InstitutionalAccountPage() {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const tenantId = auth.activeContext?.tenantId ?? auth.user?.tenantId ?? null;
  const tenantName =
    auth.activeContext?.tenantName ?? auth.user?.tenantName ?? "Institución";

  const {
    data: summary,
    error: summaryError,
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
    error: adminsError,
    isFetching: isAdminsFetching,
    refetch: refetchAdmins,
  } = useListTenantAdminsQuery(tenantId ?? "", { skip: !tenantId });
  const {
    data: invitations = [],
    error: invitationsError,
    isFetching: isInvitationsFetching,
    refetch: refetchInvitations,
  } = useGetInstitutionalAdminInvitationsQuery(tenantId ?? "", {
    skip: !tenantId,
  });
  const {
    data: applications = [],
    error: applicationsError,
    isFetching: isApplicationsFetching,
    refetch: refetchApplications,
  } = useGetInstitutionalApplicationsQuery(
    tenantId ? { tenantId } : undefined,
    { skip: !tenantId },
  );
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
  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] =
    useState<TenantAdminAssignment | null>(null);

  const admins = adminsResponse?.data ?? [];
  const effectiveAdmins = useMemo(
    () =>
      admins.filter(
        (admin) => isApprovedActiveAdmin(admin),
      ),
    [admins],
  );
  const currentTenantAdmin = useMemo(
    () => {
      const userId = normalizeAdminMatchValue(auth.user?.id);
      const membershipId = normalizeAdminMatchValue(auth.activeContext?.membershipId);
      const email = normalizeAdminMatchValue(auth.user?.email);
      const dni = normalizeAdminMatchValue(auth.user?.dni);
      const activeTenantId = normalizeAdminMatchValue(tenantId);

      return effectiveAdmins.find((admin) => {
        if (activeTenantId && normalizeAdminMatchValue(admin.tenantId) !== activeTenantId) {
          return false;
        }

        return (
          (userId && normalizeAdminMatchValue(admin.userId) === userId) ||
          (membershipId && normalizeAdminMatchValue(admin.assignmentId) === membershipId) ||
          (email && normalizeAdminMatchValue(admin.email) === email) ||
          (dni && normalizeAdminMatchValue(getAdminDni(admin)) === dni)
        );
      }) ?? null;
    },
    [
      auth.activeContext?.membershipId,
      auth.user?.dni,
      auth.user?.email,
      auth.user?.id,
      effectiveAdmins,
      tenantId,
    ],
  );
  const isPrimaryAdmin = useMemo(
    () =>
      Boolean(
        currentTenantAdmin &&
          isApprovedActiveAdmin(currentTenantAdmin) &&
          isPrimaryInstitutionalRole(currentTenantAdmin.institutionalRole),
      ),
    [currentTenantAdmin],
  );
  const currentPrimary = useMemo(
    () =>
      effectiveAdmins.find(
        (admin) =>
          isPrimaryInstitutionalRole(admin.institutionalRole) &&
          isApprovedActiveAdmin(admin),
      ) ?? null,
    [effectiveAdmins],
  );
  const effectiveAdminKeys = useMemo(() => {
    const keys = new Set<string>();
    effectiveAdmins.forEach((admin) => {
      [
        admin.userId,
        admin.email,
        getAdminDni(admin),
        admin.accountAddress,
      ].forEach((value) => {
        const normalized = String(value ?? "").trim().toLowerCase();
        if (normalized) keys.add(normalized);
      });
    });
    return keys;
  }, [effectiveAdmins]);
  const tenantApplications = useMemo(
    () =>
      applications.filter((application) => {
        if (!tenantId || application.tenantId !== tenantId) return false;
        if ((application.status ?? "PENDING_APPROVAL") !== "PENDING_APPROVAL") {
          return false;
        }
        const candidateKeys = [
          application.userId,
          application.email,
          application.dni,
        ].map((value) => String(value ?? "").trim().toLowerCase());
        return !candidateKeys.some((key) => key && effectiveAdminKeys.has(key));
      }),
    [applications, effectiveAdminKeys, tenantId],
  );

  const requiresWalletUpdate = useMemo(() => {
    if (summary?.walletStatus !== "MISSING" && summary?.wallet) return false;
    if (summaryError) return isWalletUpdateRequiredError(summaryError);
    if (summary?.walletStatus === "MISSING") return true;
    return false;
  }, [summary?.wallet, summary?.walletStatus, summaryError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "associate-account") {
      setRegularizationOpen(true);
      params.delete("action");
      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

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
    setFeedback("Cuenta asociada correctamente.");
    setRegularizationOpen(false);
    resetRegularization();
    await Promise.all([
      refetchSummary(),
      refetchAdmins(),
      refetchInvitations(),
      refetchApplications(),
    ]);
  };

  const handleCreateInvitation = async (payload: { dni: string }) => {
    if (!tenantId || isCreatingInvitation) return;
    setActionError(null);
    try {
      await createInvitation({ tenantId, dni: payload.dni }).unwrap();
      setFeedback("Invitación creada. La cuenta queda Pendiente.");
      setAddAccountOpen(false);
      resetCreateInvitation();
      await Promise.all([refetchInvitations(), refetchAdmins(), refetchApplications()]);
    } catch (error) {
      setActionError(getInvitationErrorMessage(error));
      throw error;
    }
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
        : "Acceso suspendido. La wallet permanece autorizada.",
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Cuenta institucional
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Gestiona tu cuenta, administradores, invitaciones y solicitudes de acceso.
            </p>
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
          {isSummaryLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Cargando cuenta...
            </div>
          ) : requiresWalletUpdate || summary?.walletStatus === "MISSING" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    Tu cuenta todavía no está asociada.
                  </p>
                  <p className="mt-1">
                    Ingresa tu CI/DNI para buscar y asociar automáticamente la cuenta registrada para tu usuario.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setRegularizationOpen(true)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                      Asociar mi cuenta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : summaryError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    No pudimos cargar la información.
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetchSummary()}
                    className="mt-4 rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                  >
                    Volver a intentar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-5">
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Administradores y cuentas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Cuentas habilitadas para gestionar esta institución.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                    <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                    {effectiveAdmins.length} cuenta{effectiveAdmins.length === 1 ? "" : "s"}
                  </span>
                  {isPrimaryAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetCreateInvitation();
                        setActionError(null);
                        setAddAccountOpen(true);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#459151] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#3a7a44] sm:w-auto"
                    >
                      <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                      Añadir administrador
                    </button>
                  ) : null}
                </div>
              </div>

              {isAdminsFetching ? (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Cargando cuentas institucionales...
                </div>
              ) : adminsError ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
                  No pudimos cargar las cuentas. Inténtalo nuevamente.
                </div>
              ) : effectiveAdmins.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {effectiveAdmins.map((admin) => (
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
                          {shortWalletAddress(admin.accountAddress)}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-amber-700">
                          Cuenta pendiente.
                        </p>
                      )}

                      {isPrimaryAdmin &&
                      admin.assignmentId &&
                      !isPrimaryInstitutionalRole(admin.institutionalRole) ? (
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
                  No hay otras cuentas asociadas a esta institución.
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
              </div>

              {isInvitationsFetching ? (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Cargando invitaciones...
                </div>
              ) : invitationsError ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
                  No pudimos cargar las invitaciones. Inténtalo nuevamente.
                </div>
              ) : invitations.length ? (
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

              {isApplicationsFetching ? (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Cargando solicitudes...
                </div>
              ) : applicationsError ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
                  No pudimos cargar las solicitudes. Inténtalo nuevamente.
                </div>
              ) : tenantApplications.length ? (
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
                  No tienes solicitudes de acceso pendientes.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      <RegularizationModal
        isOpen={regularizationOpen}
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
