import type {
  MyTvdPaymentResponse,
  PaymentStatus,
  PublicQrPaymentResponse,
  TokenAccreditationStatus,
} from "@/store/tvd";

const BOB_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const IDEMPOTENCY_FALLBACK_BYTES = 16;

export type AmountValidationResult =
  | { valid: true; amount: string; amountMinor: string }
  | { valid: false; message: string };

export const validateBobAmount = (value: string): AmountValidationResult => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, message: "Ingresa un monto válido en BOB." };
  }
  if (
    trimmed.includes(",") ||
    /e/i.test(trimmed) ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-")
  ) {
    return { valid: false, message: "Usa un monto en BOB con hasta dos decimales." };
  }
  if (!BOB_AMOUNT_PATTERN.test(trimmed)) {
    return { valid: false, message: "Usa un monto en BOB con hasta dos decimales." };
  }

  const [integerPart, decimalPart = ""] = trimmed.split(".");
  const amountMinor = BigInt(integerPart) * 100n + BigInt(decimalPart.padEnd(2, "0"));
  if (amountMinor <= 0n) {
    return { valid: false, message: "El monto debe ser mayor que cero." };
  }

  return {
    valid: true,
    amount: `${integerPart}.${decimalPart.padEnd(2, "0")}`,
    amountMinor: amountMinor.toString(),
  };
};

export const normalizeRechargeDescription = (value: string) =>
  value.trim() || "Recarga operativa";

export const validateRechargeDescription = (value: string) => {
  const description = normalizeRechargeDescription(value);
  if (description.length > 60) {
    return {
      valid: false,
      message: "La descripción debe tener máximo 60 caracteres.",
    } as const;
  }
  return { valid: true, description } as const;
};

export const createRechargePayloadFingerprint = ({
  amount,
  currency,
  description,
}: {
  amount: string;
  currency: "BOB";
  description: string;
}) => `${currency}:${amount}:${description}`;

const fallbackRandomHex = () => {
  const bytes = new Uint8Array(IDEMPOTENCY_FALLBACK_BYTES);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const generatePaymentIdempotencyKey = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  return `qr-${Date.now().toString(36)}-${fallbackRandomHex()}`;
};

export const getQrImageSource = (qrImage?: string | null) => {
  const image = qrImage?.trim();
  if (!image) return null;
  if (image.startsWith("data:image/")) return image;
  return `data:image/png;base64,${image}`;
};

export const getPaymentId = (
  payment: PublicQrPaymentResponse | MyTvdPaymentResponse | null | undefined,
) => {
  if (!payment) return null;
  return "paymentId" in payment ? payment.paymentId : payment.id;
};

export const isPaymentTerminal = (status?: PaymentStatus | string | null) =>
  status === "PAYMENT_CONFIRMED" ||
  status === "EXPIRED" ||
  status === "CANCELLED" ||
  status === "FAILED" ||
  status === "MISMATCH" ||
  status === "MANUAL_REVIEW";

export const isAccreditationTerminal = (
  status?: TokenAccreditationStatus | string | null,
) => status === "CONFIRMED" || status === "FAILED" || status === "NEEDS_REVIEW";

export const shouldPollPayment = (
  payment: MyTvdPaymentResponse | PublicQrPaymentResponse | null | undefined,
) => {
  if (!payment) return true;
  if (payment.status !== "PAYMENT_CONFIRMED") {
    return !isPaymentTerminal(payment.status);
  }
  const accreditationStatus =
    "accreditationStatus" in payment
      ? payment.accreditationStatus
      : payment.tokenAccreditation?.status;
  return !isAccreditationTerminal(accreditationStatus);
};

export const getPaymentStatusMessage = (status?: PaymentStatus | string | null) => {
  switch (status) {
    case "CREATED":
    case "QR_REQUESTING":
    case "QR_ACTIVE":
      return "QR generado. Esperando confirmación del pago.";
    case "PAYMENT_CONFIRMED":
      return "Pago recibido correctamente.";
    case "EXPIRED":
      return "El QR expiró. Genera un nuevo intento.";
    case "CANCELLED":
      return "El pago fue cancelado.";
    case "MISMATCH":
    case "MANUAL_REVIEW":
      return "El pago requiere revisión antes de continuar.";
    case "FAILED":
      return "No pudimos completar el pago.";
    default:
      return "No pudimos determinar el estado del pago.";
  }
};

export const getAccreditationStatusMessage = (
  paymentStatus?: PaymentStatus | string | null,
  accreditationStatus?: TokenAccreditationStatus | string | null,
) => {
  if (paymentStatus !== "PAYMENT_CONFIRMED") {
    return "La acreditación TVD comenzará cuando el pago sea confirmado.";
  }
  switch (accreditationStatus) {
    case "PENDING":
      return "Pago recibido; acreditación TVD en proceso.";
    case "SUBMITTING":
      return "Preparando acreditación TVD.";
    case "SUBMITTED":
      return "Transacción TVD enviada.";
    case "CONFIRMED":
      return "TVD acreditados correctamente.";
    case "NEEDS_REVIEW":
      return "Pago recibido; la acreditación requiere revisión.";
    case "FAILED":
      return "Pago recibido; estamos recuperando la acreditación.";
    case null:
    case undefined:
      return "Pago recibido; acreditación pendiente de creación.";
    default:
      return "Pago recibido; revisa el estado de acreditación.";
  }
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
