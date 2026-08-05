import { describe, expect, it } from "vitest";
import {
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  convertBurnBpsToPercentage,
  getKnownBaseNetwork,
  isRewardEnabled,
  truncateAddress,
} from "@/shared/tvd/tvdBlockchainFormatters";
import {
  getWalletLookupFeedback,
  getWalletLookupErrorMessage,
  validateWalletLookupAddress,
} from "@/domains/superadmin/utils/tvdWalletLookup";
import type { TvdWalletLookupResponse } from "@/store/tvd";

const associatedWallet: TvdWalletLookupResponse = {
  accountAddress: "0x1234567890AbcdEF1234567890aBcdef12345678",
  registeredInIdentity: true,
  identityStatus: "REGISTERED",
  associationStatus: "ASSOCIATED",
  canUse: true,
  reasonCode: "WALLET_ASSOCIATED",
  associations: [],
};

describe("MX-16 | contrato, parámetros y wallets globales", () => {
  it("[MX-16][ADM-CTR-P0-001][UNITARIA] reconoce Base y Base Sepolia, trunca identificadores y no crea enlaces incompletos", () => {
    expect(getKnownBaseNetwork(8453).name).toBe("Base");
    expect(getKnownBaseNetwork(84532).name).toBe("Base Sepolia");
    expect(truncateAddress(associatedWallet.accountAddress)).toBe("0x1234...5678");
    expect(buildExplorerAddressUrl(undefined, associatedWallet.accountAddress)).toBeNull();
    expect(buildExplorerTxUrl("https://basescan.org", null)).toBeNull();
  });

  it("[MX-16][ADM-CTR-P1-002][UNITARIA] trata fondos sin dirección, transacción o lectura como no configurados", () => {
    expect(truncateAddress(null)).toBe("No configurado");
    expect(buildExplorerAddressUrl("https://basescan.org", null)).toBeNull();
    expect(buildExplorerTxUrl(undefined, "0xhash")).toBeNull();
  });

  it("[MX-16][ADM-PRM-P0-001][UNITARIA] formatea BPS y activa recompensas únicamente por valor positivo", () => {
    expect(convertBurnBpsToPercentage(125n)).toBe("1.25%");
    expect(isRewardEnabled(0n)).toBe(false);
    expect(isRewardEnabled(1n)).toBe(true);
  });

  it("[MX-16][ADM-WAL-P0-001][UNITARIA] rechaza wallet vacía, inválida y zero address, y muestra un estado administrativo legible", () => {
    expect(validateWalletLookupAddress("")).toBe("Ingresa una dirección de wallet.");
    expect(validateWalletLookupAddress("0x0000000000000000000000000000000000000000")).toBe("La dirección de wallet no es válida.");
    expect(validateWalletLookupAddress(associatedWallet.accountAddress)).toBeNull();
    expect(getWalletLookupFeedback(associatedWallet).title).toBe("Wallet registrada y asociada");
  });

  it("[MX-16][ADM-WAL-P1-002][UNITARIA] conserva la decisión de elegibilidad fuera de valores de wallet ambiguos", () => {
    expect(getWalletLookupFeedback({ ...associatedWallet, canUse: false, reasonCode: "WALLET_DISABLED" }).tone).toBe("danger");
    expect(getWalletLookupFeedback({ ...associatedWallet, canUse: false, reasonCode: "WALLET_INCOMPATIBLE" }).title).toBe("Wallet incompatible");
  });

  it("[MX-16][ADM-SEC-P0-002][UNITARIA] devuelve un error seguro sin reflejar secretos del proveedor", () => {
    const message = getWalletLookupErrorMessage({ status: 503, data: { message: "private-key serializedTransaction" } });
    expect(message).toBe("No pudimos validar la wallet. Intenta nuevamente.");
    expect(message).not.toContain("private-key");
  });

  it("[MX-16][SOPORTE-CON-RED][UNITARIA] conserva una red desconocida sin inventar explorador", () => {
    expect(getKnownBaseNetwork(999).name).toBe("Red 999");
    expect(getKnownBaseNetwork(999).explorerBaseUrl).toBeNull();
  });

  it("[MX-16][ADM-UX-P2-001][UNITARIA] preserva el valor completo mientras muestra la representación truncada", () => {
    const value = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(value)).toBe("0x1234...5678");
    expect(value).toHaveLength(42);
  });
});
