import { describe, expect, it } from "vitest";
import {
  getReasonCodeLabel,
  getWalletLookupErrorMessage,
  getWalletLookupFeedback,
  validateWalletLookupAddress,
} from "@/domains/superadmin/utils/tvdWalletLookup";
import type { TvdWalletLookupResponse } from "@/store/tvd";

const lookupResponse: TvdWalletLookupResponse = {
  accountAddress: "0x1234567890AbcdEF1234567890aBcdef12345678",
  registeredInIdentity: true,
  identityStatus: "REGISTERED",
  associationStatus: "ASSOCIATED",
  canUse: true,
  reasonCode: "WALLET_ASSOCIATED",
  associations: [],
};

describe("tvd wallet lookup UI helpers", () => {
  it.each([
    ["", "Ingresa una dirección de wallet."],
    ["   ", "Ingresa una dirección de wallet."],
    ["abc", "La dirección de wallet no es válida."],
    ["0x123", "La dirección de wallet no es válida."],
    [
      "0x0000000000000000000000000000000000000000",
      "La dirección de wallet no es válida.",
    ],
    ["0x1234567890abcdef1234567890abcdef12345678", null],
    ["  0x1234567890AbcdEF1234567890aBcdef12345678  ", null],
  ])("valida dirección %s", (value, expected) => {
    expect(validateWalletLookupAddress(value)).toBe(expected);
  });

  it("mapea reason codes conocidos sin exponer códigos crudos", () => {
    expect(getWalletLookupFeedback(lookupResponse)).toEqual({
      title: "Wallet registrada y asociada",
      description:
        "La wallet tiene una asociación institucional registrada en Results.",
      tone: "success",
    });
    expect(getReasonCodeLabel("WALLET_DISABLED")).toBe(
      "Wallet no disponible",
    );
  });

  it("usa fallback seguro para reason codes desconocidos", () => {
    expect(
      getWalletLookupFeedback({
        ...lookupResponse,
        reasonCode: "BACKEND_NEW_REASON",
        canUse: false,
      }),
    ).toEqual({
      title: "Estado no determinado",
      description: "No pudimos determinar el estado de la wallet.",
      tone: "warning",
    });
  });

  it("mapea errores HTTP a mensajes seguros", () => {
    expect(getWalletLookupErrorMessage({ status: 403, data: {} })).toBe(
      "No tienes permisos para consultar wallets globalmente.",
    );
    expect(getWalletLookupErrorMessage({ status: 503, data: {} })).toBe(
      "No pudimos validar la wallet. Intenta nuevamente.",
    );
    expect(getWalletLookupErrorMessage({ status: 500, data: {} })).toBe(
      "El servicio no está disponible. Intenta nuevamente.",
    );
  });
});
