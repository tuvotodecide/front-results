import { describe, expect, it, vi } from "vitest";
import {
  createRechargePayloadFingerprint,
  generatePaymentIdempotencyKey,
  getAccreditationStatusMessage,
  getPaymentStatusMessage,
  getQrImageSource,
  isAccreditationTerminal,
  shouldPollPayment,
  validateBobAmount,
  validateRechargeDescription,
} from "@/features/adminTvd/utils/rechargeFlow";
import type { MyTvdPaymentResponse } from "@/store/tvd";

const makePayment = (
  status: MyTvdPaymentResponse["status"],
  accreditationStatus: MyTvdPaymentResponse["accreditationStatus"] = null,
): MyTvdPaymentResponse => ({
  paymentId: "payment-1",
  amount: "10.50",
  amountMinor: "1050",
  currency: "BOB",
  status,
  provider: "RED_ENLACE",
  merchantReference: "123456",
  providerReference: null,
  qrExpiresAt: null,
  confirmationSource: null,
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:00:00.000Z",
  confirmedAt: null,
  tvdQuote: null,
  accreditationId: accreditationStatus ? "acc-1" : null,
  accreditationStatus,
  txHash: null,
});

describe("admin TVD recharge utilities", () => {
  it("valida y normaliza montos BOB sin usar floats como autoridad", () => {
    expect(validateBobAmount("10")).toEqual({
      valid: true,
      amount: "10.00",
      amountMinor: "1000",
    });
    expect(validateBobAmount("10.5")).toEqual({
      valid: true,
      amount: "10.50",
      amountMinor: "1050",
    });
    expect(validateBobAmount("0")).toMatchObject({ valid: false });
    expect(validateBobAmount("-1")).toMatchObject({ valid: false });
    expect(validateBobAmount("10.555")).toMatchObject({ valid: false });
    expect(validateBobAmount("1e3")).toMatchObject({ valid: false });
    expect(validateBobAmount("  ")).toMatchObject({ valid: false });
  });

  it("valida descripcion y genera fingerprint sin incluir wallet ni tasa", () => {
    expect(validateRechargeDescription("")).toEqual({
      valid: true,
      description: "Recarga operativa",
    });
    expect(validateRechargeDescription("x".repeat(61))).toMatchObject({
      valid: false,
    });
    expect(
      createRechargePayloadFingerprint({
        amount: "10.50",
        currency: "BOB",
        description: "Recarga operativa",
      }),
    ).toBe("BOB:10.50:Recarga operativa");
  });

  it("genera Idempotency-Key estable con randomUUID cuando existe", () => {
    const randomUUID = vi.fn(() => "uuid-123");
    vi.stubGlobal("crypto", { randomUUID });

    expect(generatePaymentIdempotencyKey()).toBe("uuid-123");
    expect(randomUUID).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("normaliza imagen QR base64 sin construir una glosa ni payload falso", () => {
    expect(getQrImageSource("iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(getQrImageSource("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc",
    );
    expect(getQrImageSource(null)).toBeNull();
  });

  it("separa estados terminales de pago y acreditacion", () => {
    expect(shouldPollPayment(makePayment("QR_ACTIVE"))).toBe(true);
    expect(shouldPollPayment(makePayment("EXPIRED"))).toBe(false);
    expect(shouldPollPayment(makePayment("PAYMENT_CONFIRMED", "PENDING"))).toBe(
      true,
    );
    expect(shouldPollPayment(makePayment("PAYMENT_CONFIRMED", "CONFIRMED"))).toBe(
      false,
    );
    expect(isAccreditationTerminal("NEEDS_REVIEW")).toBe(true);
  });

  it("mapea mensajes sin marcar un pago confirmado como fallo de recarga", () => {
    expect(getPaymentStatusMessage("PAYMENT_CONFIRMED")).toContain("Pago recibido");
    expect(getAccreditationStatusMessage("PAYMENT_CONFIRMED", "PENDING")).toContain(
      "acreditación TVD en proceso",
    );
    expect(getAccreditationStatusMessage("PAYMENT_CONFIRMED", "NEEDS_REVIEW")).toContain(
      "requiere revisión",
    );
  });
});
