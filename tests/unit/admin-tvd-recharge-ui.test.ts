import { describe, expect, it, vi } from "vitest";
import {
  createRechargePayloadFingerprint,
  buildQrDownloadFilename,
  downloadQrPng,
  generatePaymentIdempotencyKey,
  getAccreditationStatusMessage,
  getPaymentStatusMessage,
  getQrImageSource,
  isValidQrPngImage,
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
  it("[MX-06][TVD-QR-P0-001][UNITARIA] valida y normaliza montos BOB sin usar floats como autoridad", () => {
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

  it("TVD-QR-P0-004 | valida descripcion y genera fingerprint sin incluir wallet ni tasa", () => {
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

  it("TVD-QR-P0-004 | genera Idempotency-Key estable con randomUUID cuando existe", () => {
    const randomUUID = vi.fn(() => "uuid-123");
    vi.stubGlobal("crypto", { randomUUID });

    expect(generatePaymentIdempotencyKey()).toBe("uuid-123");
    expect(randomUUID).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("[MX-06][TVD-QR-P0-002][UNITARIA] normaliza imagen QR Base64 sin construir un payload falso", () => {
    expect(getQrImageSource("iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(getQrImageSource("data:image/png;base64,abc")).toBe(
      null,
    );
    expect(getQrImageSource("data:image/png;base64,iVBORw0KGgo=")).toBe(
      "data:image/png;base64,iVBORw0KGgo=",
    );
    expect(getQrImageSource("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(getQrImageSource(null)).toBeNull();
  });

  it("TVD-QR-P1-005 | valida y descarga solo QR PNG con nombre seguro", () => {
    expect(isValidQrPngImage("iVBORw0KGgo=")).toBe(true);
    expect(isValidQrPngImage("R0lGODlh")).toBe(false);
    expect(buildQrDownloadFilename("123/456:secret")).toBe(
      "qr-recarga-tvd-123456secret.png",
    );

    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      click,
      remove,
      set href(value: string) {
        expect(value).toBe("blob:qr");
      },
      set download(value: string) {
        expect(value).toBe("qr-recarga-tvd-123456.png");
      },
      set rel(value: string) {
        expect(value).toBe("noopener");
      },
    } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(anchor);
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation(
      (node) => node,
    );
    const createObjectURL = vi.fn(() => "blob:qr");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    expect(downloadQrPng("iVBORw0KGgo=", "123456")).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:qr");

    expect(downloadQrPng("bad", "123456")).toBe(false);

    createElement.mockRestore();
    appendChild.mockRestore();
    vi.unstubAllGlobals();
  });

  it("TVD-QR-P0-006 TVD-RES-P0-001 TVD-UI-P1-001 | separa estados terminales de pago y acreditacion", () => {
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

  it("[MX-06][TVD-SEC-P0-002][UNITARIA] mapea mensajes seguros sin exponer secretos", () => {
    expect(getPaymentStatusMessage("PAYMENT_CONFIRMED")).toContain("Pago recibido");
    expect(getAccreditationStatusMessage("PAYMENT_CONFIRMED", "PENDING")).toContain(
      "tokens en proceso",
    );
    expect(getAccreditationStatusMessage("PAYMENT_CONFIRMED", "NEEDS_REVIEW")).toContain(
      "requiere revisión",
    );
    const visibleCopy = [
      getPaymentStatusMessage("QR_ACTIVE"),
      getPaymentStatusMessage("PAYMENT_CONFIRMED"),
      getAccreditationStatusMessage("PAYMENT_CONFIRMED", "PENDING"),
      getAccreditationStatusMessage("PAYMENT_CONFIRMED", "CONFIRMED"),
      getAccreditationStatusMessage("PAYMENT_CONFIRMED", "NEEDS_REVIEW"),
    ].join(" ");
    expect(visibleCopy).not.toContain("privateKey");
    expect(visibleCopy).not.toContain("Authorization");
    expect(visibleCopy).not.toContain("rpc.example");
    expect(visibleCopy).not.toContain("payloadQr");
  });
});
