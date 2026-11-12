import CopyButton from "@/domains/superadmin/components/CopyButton";
import type { ApprovalStatus } from "@/store/accessApprovals";

// Piezas visuales compartidas por las bandejas institucional y territorial de /aprobaciones.

export type FeedbackState = { kind: "success" | "warning" | "error"; message: string } | null;
export type ActionTone = "primary" | "danger" | "secondary";

export const normalizeSearchText = (value?: string | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export const getActionErrorMessage = (error: unknown) => {
  const data = (error as { data?: unknown })?.data;
  const message =
    typeof data === "object" && data !== null && "message" in data
      ? (data as { message?: unknown }).message
      : undefined;

  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message.join(" ");
  }
  return "No se pudo completar la acción. Revisa el estado actual y vuelve a intentarlo.";
};

export const formatDate = (value?: string) => {
  if (!value) return "No informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const badgeClassName = (status?: ApprovalStatus) => {
  if (status === "APPROVED") {
    return "border-[#5fd08b] bg-[#ebfff1] text-[#15703c]";
  }

  if (
    status === "PENDING_APPROVAL" ||
    status === "PENDING_EMAIL_VERIFICATION" ||
    status === "PENDING_MOBILE_AUTHORIZATION" ||
    status === "PENDING_CHAIN_CONFIRMATION" ||
    status === "RECONCILIATION_PENDING"
  ) {
    return "border-[#f2d88a] bg-[#fff8de] text-[#8a6a14]";
  }

  if (status === "CHAIN_RETRY_PENDING" || status === "CHAIN_FAILED") {
    return "border-[#f3bf8d] bg-[#fff3e7] text-[#a45b16]";
  }

  if (status === "REVOKED") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (status === "REJECTED") {
    return "border-[#ffb4b4] bg-[#fff0f0] text-[#cc2e2e]";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
};

export const actionClassName = (tone: ActionTone) => {
  if (tone === "primary") {
    return "bg-[#2f8b3c] text-white hover:bg-[#287633]";
  }

  if (tone === "danger") {
    return "bg-[#db3732] text-white hover:bg-[#c02e29]";
  }

  return "border border-[#f0bc68] text-[#a86600] hover:bg-[#fff8ec]";
};

const abbreviateHash = (value: string) =>
  value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;

export const InfoLine = ({
  label,
  value,
  technicalHash = false,
}: {
  label: string;
  value?: string | null;
  technicalHash?: boolean;
}) => (
  <div className="min-w-0 space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
      {label}
    </p>
    {technicalHash && value ? (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="min-w-0 break-all font-mono text-sm text-gray-800" title={value}>
          {abbreviateHash(value)}
        </p>
        <CopyButton value={value} label="Copiar" />
      </div>
    ) : (
      <p className="break-words text-sm text-gray-800">{value || "No informado"}</p>
    )}
  </div>
);

export const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-5 w-5 text-[#9ca3af]"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
    <circle cx="11" cy="11" r="6.5" />
  </svg>
);

export const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
);
