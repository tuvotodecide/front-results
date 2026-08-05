import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildTvdManualAssignmentPayloadFingerprint,
  normalizeTvdTokenAmount,
  validateTvdManualAssignmentAmount,
  validateTvdManualAssignmentReason,
} from "@/domains/superadmin/utils/tvdManualAssignment";
import {
  createRechargePayloadFingerprint,
  getAccreditationStatusLabel,
  getAccreditationStatusMessage,
  getPaymentStatusLabel,
  getQrImageSource,
  isPaymentTerminal,
  shouldPollPayment,
  validateBobAmount,
} from "@/features/adminTvd/utils/rechargeFlow";
import {
  getTvdCapacityReasonMessage,
  isTvdCapacityRechargeable,
} from "@/features/adminTvd/utils/tvdCapacityUi";
import { getOfficialPublicationStatusMessage } from "@/features/electionConfig/data/useElectionPublish";
import { getTvdManualAssignmentErrorMessage } from "@/domains/superadmin/utils/tvdManualAssignment";
import { getCapacityRequestErrorMessage } from "@/features/adminTvd/utils/tvdCapacityUi";

const viemMocks = vi.hoisted(() => {
  const readContract = vi.fn();
  return {
    readContract,
    createPublicClient: vi.fn(() => ({ readContract })),
    http: vi.fn((url: string) => ({ url })),
    formatUnits: vi.fn((value: bigint, decimals: number) => {
      const divisor = 10n ** BigInt(decimals);
      const whole = value / divisor;
      const fraction = value % divisor;
      return fraction === 0n
        ? whole.toString()
        : `${whole}.${fraction.toString().padStart(decimals, "0")}`;
    }),
    isAddress: vi.fn((value: string) => /^0x[a-fA-F0-9]{40}$/.test(value)),
    getAddress: vi.fn((value: string) => value),
    zeroAddress: "0x0000000000000000000000000000000000000000",
  };
});

vi.mock("viem", () => viemMocks);

type PaymentFixture = {
  paymentId: string;
  status: "QR_ACTIVE" | "PAYMENT_CONFIRMED" | "EXPIRED" | "RECONCILIATION_PENDING";
  accreditationStatus: "PENDING" | "CONFIRMED" | null;
};

const payment = (
  status: PaymentFixture["status"],
  accreditationStatus: PaymentFixture["accreditationStatus"] = null,
): PaymentFixture => ({ paymentId: "payment-1", status, accreditationStatus });

describe("MX-06 | TVD canónico unitario", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("[MX-06][TVD-ASSIGN-P0-001][UNITARIA] construye una intención institucional autorizada y estable", () => {
    const intent = {
      tenantId: "tenant-1",
      assignmentId: "assignment-1",
      tokenAmount: "12.50",
      reason: "Asignación operativa aprobada",
    };

    expect(validateTvdManualAssignmentAmount(intent.tokenAmount)).toBeNull();
    expect(validateTvdManualAssignmentReason(intent.reason)).toBeNull();
    expect(normalizeTvdTokenAmount(intent.tokenAmount)).toBe("12.5");
    expect(buildTvdManualAssignmentPayloadFingerprint(intent)).toBe(
      JSON.stringify(intent),
    );
  });

  it("[MX-06][TVD-ASSIGN-P0-003][UNITARIA] rechaza monto y motivo inválidos antes del envío", () => {
    expect(validateTvdManualAssignmentAmount("0")).toBe(
      "Ingresa una cantidad TVD mayor a 0.",
    );
    expect(validateTvdManualAssignmentAmount("1e3")).toBe(
      "Ingresa una cantidad TVD mayor a 0.",
    );
    expect(validateTvdManualAssignmentReason("corto")).toBe(
      "Describe un motivo de entre 8 y 240 caracteres.",
    );
    expect(validateTvdManualAssignmentReason("Asignación <script>")).toBe(
      "Describe un motivo de entre 8 y 240 caracteres.",
    );
  });

  it("[MX-06][TVD-QR-P0-001][UNITARIA] congela importe económico BOB sin precisión flotante", () => {
    expect(validateBobAmount("10.5")).toEqual({
      valid: true,
      amount: "10.50",
      amountMinor: "1050",
    });
    expect(validateBobAmount("0.01")).toEqual({
      valid: true,
      amount: "0.01",
      amountMinor: "1",
    });
    expect(validateBobAmount("10.555")).toMatchObject({ valid: false });
  });

  it("[MX-06][TVD-QR-P0-002][UNITARIA] acepta sólo el contrato visual de QR PNG válido", () => {
    expect(getQrImageSource("iVBORw0KGgo=")).toBe(
      "data:image/png;base64,iVBORw0KGgo=",
    );
    expect(getQrImageSource("data:image/png;base64,iVBORw0KGgo=")).toBe(
      "data:image/png;base64,iVBORw0KGgo=",
    );
    expect(getQrImageSource("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(getQrImageSource("imagen-inválida")).toBeNull();
  });

  it("[MX-06][TVD-QR-P0-004][UNITARIA] conserva la clave funcional para una solicitud equivalente", () => {
    const request = {
      amount: "10.50",
      currency: "BOB" as const,
      description: "Recarga operativa",
    };

    expect(createRechargePayloadFingerprint(request)).toBe(
      createRechargePayloadFingerprint({ ...request }),
    );
    expect(createRechargePayloadFingerprint(request)).not.toBe(
      createRechargePayloadFingerprint({ ...request, amount: "11.00" }),
    );
  });

  it("[MX-06][TVD-QR-P0-010][UNITARIA] bloquea regeneración mientras el pago real requiere conciliación", () => {
    expect(isPaymentTerminal("EXPIRED")).toBe(true);
    expect(shouldPollPayment(payment("EXPIRED") as never)).toBe(false);
    expect(isPaymentTerminal("RECONCILIATION_PENDING")).toBe(false);
    expect(shouldPollPayment(payment("RECONCILIATION_PENDING") as never)).toBe(true);
  });

  it("[MX-06][TVD-RES-P0-004][UNITARIA] toma balanceOf on-chain como fuente de capacidad", async () => {
    vi.stubEnv("VITE_TVD_CHAIN_ID", "84532");
    vi.stubEnv("VITE_TVD_CHAIN_RPC_URL", "https://rpc.example.test");
    vi.stubEnv("VITE_TVD_TOKEN_ADDRESS", "0x1111111111111111111111111111111111111111");
    vi.stubEnv("VITE_TVD_DECIMALS", "18");
    viemMocks.readContract
      .mockResolvedValueOnce(80_000000000000000000n)
      .mockResolvedValueOnce(20_000000000000000000n);
    const { readTvdOnChainBalance } = await import(
      "@/features/adminTvd/services/tvdOnChainBalance"
    );

    const balance = await readTvdOnChainBalance(
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333",
      84532,
    );

    expect(balance.liquidBalanceSmallestUnit).toBe("80000000000000000000");
    expect(balance.assignedBalanceSmallestUnit).toBe("20000000000000000000");
    expect(balance.totalBalanceSmallestUnit).toBe("100000000000000000000");
    expect(viemMocks.readContract).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ functionName: "balanceOf" }),
    );
    expect(viemMocks.readContract).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ functionName: "assignedBalance" }),
    );
  });

  it("[MX-06][TVD-PUB-P0-003][UNITARIA] bloquea publicación y ofrece recarga sólo por déficit autoritativo", () => {
    expect(getTvdCapacityReasonMessage("INSUFFICIENT_TVD_BALANCE")).toBe(
      "Faltan TVD para cubrir esta elección.",
    );
    expect(isTvdCapacityRechargeable("INSUFFICIENT_TVD_BALANCE")).toBe(true);
    expect(isTvdCapacityRechargeable("PADRON_PROCESSING")).toBe(false);
  });

  it("[MX-06][TVD-SEC-P0-002][UNITARIA] sanitiza secretos y detalles internos de errores", () => {
    const assignmentMessage = getTvdManualAssignmentErrorMessage({
      status: 403,
      data: {
        code: "TVD_MANUAL_ASSIGNMENT_UNAUTHORIZED",
        privateKey: "secret-key",
        callData: "0xdeadbeef",
      },
    });
    const capacityMessage = getCapacityRequestErrorMessage({
      status: 503,
      data: { code: "OFFICIAL_PUBLICATION_VOTE_MANAGER_NOT_OPERATOR", rpcUrl: "https://rpc.internal" },
    });

    expect(assignmentMessage).toBe("No tienes permisos para asignar TVD manualmente.");
    expect(
      getTvdManualAssignmentErrorMessage({
        status: 400,
        data: { code: "TVD_WALLET_NOT_VERIFIED", wallet: "0xprivate" },
      }),
    ).toBe("La wallet seleccionada no está verificada.");
    expect(capacityMessage).toBe(
      "La publicación no está disponible en este momento. Intenta nuevamente más tarde.",
    );
    expect(`${assignmentMessage} ${capacityMessage}`).not.toMatch(
      /secret-key|callData|rpc\.internal|0xdeadbeef/i,
    );
  });

  it("[MX-06][TVD-UI-P1-001][UNITARIA] diferencia pago, acreditación, capacidad y publicación", () => {
    expect(getPaymentStatusLabel("PAYMENT_CONFIRMED")).toBe("Pago confirmado");
    expect(getAccreditationStatusLabel("PAYMENT_CONFIRMED", "PENDING")).toBe(
      "Procesando tokens",
    );
    expect(getAccreditationStatusMessage("PAYMENT_CONFIRMED", "PENDING")).toBe(
      "Pago recibido; tokens en proceso.",
    );
    expect(getAccreditationStatusLabel("PAYMENT_CONFIRMED", "CONFIRMED")).toBe(
      "Tokens recibidos",
    );
    expect(getAccreditationStatusMessage("PAYMENT_CONFIRMED", "CONFIRMED")).toBe(
      "TVD acreditados correctamente.",
    );
    expect(getTvdCapacityReasonMessage("INSUFFICIENT_TVD_BALANCE")).toBe(
      "Faltan TVD para cubrir esta elección.",
    );
    expect(getOfficialPublicationStatusMessage("COMPLETED")).toBe(
      "La votación fue publicada oficialmente.",
    );
  });
});
