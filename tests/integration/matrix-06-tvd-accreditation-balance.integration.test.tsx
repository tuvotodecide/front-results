import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { apiSlice } from "@/store/apiSlice";
import {
  configureCapacityMocks,
  createCapacityFixture,
  renderCapacityReview,
  resetCapacityMocks,
} from "./helpers/mx06/balanceCapacityHarness";
import {
  configureRechargeMocks,
  createRechargeFixtures,
  renderRechargePage,
  resetRechargeMocks,
  visualBalanceRefetch,
} from "./helpers/mx06/rechargeHarness";

async function createConfirmedRecharge(user: ReturnType<typeof userEvent.setup>) {
  const amountInput = screen.getByLabelText("Monto BOB a pagar");
  await user.clear(amountInput);
  await user.type(amountInput, "10.50");
  await screen.findByText("4.2 TVD");
  await user.click(screen.getByRole("button", { name: /Generar QR/i }));
}

describe("MX-06 | acreditación y saldo TVD", () => {
  afterEach(() => {
    resetRechargeMocks();
    resetCapacityMocks();
  });

  it("[MX-06][TVD-RES-P0-001][INTEGRACION] inicia la acreditación sin convertir el pago confirmado en saldo", async () => {
    const user = userEvent.setup();
    const rechargeFixtures = createRechargeFixtures();
    configureRechargeMocks({
      paymentDetails: { "payment-1": [rechargeFixtures.confirmedPayment] },
    });
    const recharge = renderRechargePage();

    await createConfirmedRecharge(user);
    expect(await screen.findByText("Procesando tokens")).toBeInTheDocument();
    expect(screen.getByText("Pago recibido; tokens en proceso.")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    expect(visualBalanceRefetch).not.toHaveBeenCalled();
    expect(screen.getByText("123456")).toBeInTheDocument();
    recharge.unmount();

    const capacity = createCapacityFixture();
    const { requests } = configureCapacityMocks([capacity]);
    renderCapacityReview();

    expect(await screen.findByText("Falta saldo para publicar")).toBeInTheDocument();
    expect(screen.getByText("5 TVD")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar publicación oficial/i }),
    ).toBeDisabled();
    expect(requests[0]?.url).not.toContain("wallet");
  });

  it("[MX-06][TVD-RES-P0-002][INTEGRACION] actualiza saldo y capacidad una sola vez tras acreditación confirmada", async () => {
    const user = userEvent.setup();
    const rechargeFixtures = createRechargeFixtures();
    const confirmedAccreditation = {
      ...rechargeFixtures.confirmedPayment,
      accreditationStatus: "CONFIRMED",
      txHash: "0xconfirmed-accreditation",
    };
    configureRechargeMocks({
      paymentDetails: {
        "payment-1": [rechargeFixtures.confirmedPayment, confirmedAccreditation],
      },
    });
    const recharge = renderRechargePage();

    await createConfirmedRecharge(user);
    expect(await screen.findByText("Pago recibido; tokens en proceso.")).toBeInTheDocument();
    act(() => {
      recharge.store.dispatch(
        apiSlice.util.invalidateTags([{ type: "TvdPayment", id: "payment-1" }]),
      );
    });
    expect(await screen.findByText("TVD acreditados correctamente.")).toBeInTheDocument();
    await waitFor(() => expect(visualBalanceRefetch).toHaveBeenCalledTimes(1));
    recharge.unmount();

    const before = createCapacityFixture();
    const after = createCapacityFixture({
      availableTokens: "10",
      availableSmallestUnit: "10000000000000000000",
      missingTokens: "2",
      missingSmallestUnit: "2000000000000000000",
    });
    configureCapacityMocks([before, after]);
    const review = renderCapacityReview();
    expect(await screen.findByText("5 TVD")).toBeInTheDocument();
    act(() => {
      review.store.dispatch(
        apiSlice.util.invalidateTags([{ type: "TvdEventCapacity", id: "evt-1" }]),
      );
    });
    expect(await screen.findByText("10 TVD")).toBeInTheDocument();
    expect(screen.queryByText("5 TVD")).not.toBeInTheDocument();
    expect(screen.queryByText("Pago recibido; tokens en proceso.")).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-RES-P0-003][INTEGRACION] mantiene saldo autoritativo ante receipt incompatible o worker bloqueado", async () => {
    const user = userEvent.setup();
    const rechargeFixtures = createRechargeFixtures();
    const blockedAccreditation = {
      ...rechargeFixtures.confirmedPayment,
      accreditationStatus: "BLOCKED_CONFIGURATION",
      blockchainStatus: "ACCREDITATION_BLOCKED_CONFIGURATION",
      flowStatus: "ACCREDITATION_BLOCKED_CONFIGURATION",
      lastAccreditationErrorCode: "TVD_RECEIPT_INCOMPATIBLE",
    };
    configureRechargeMocks({
      paymentDetails: { "payment-1": [blockedAccreditation] },
    });
    const recharge = renderRechargePage();

    await createConfirmedRecharge(user);
    expect(await screen.findByText("Requiere revisión")).toBeInTheDocument();
    expect(screen.getByText("Pago recibido; la entrega requiere revisión.")).toBeInTheDocument();
    expect(screen.getByText("123456")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    expect(visualBalanceRefetch).not.toHaveBeenCalled();
    recharge.unmount();

    configureCapacityMocks([createCapacityFixture()]);
    renderCapacityReview();
    expect(await screen.findByText("Falta saldo para publicar")).toBeInTheDocument();
    expect(screen.getByText("5 TVD")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar publicación oficial/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Recargar tokens" })).toBeInTheDocument();
  });

  it("[MX-06][TVD-RES-P0-004][INTEGRACION] consume el balance blockchain autoritativo al refrescar capacidad", async () => {
    const initialBalance = createCapacityFixture();
    const refreshedBalance = createCapacityFixture({
      availableTokens: "9",
      availableSmallestUnit: "9000000000000000000",
      missingTokens: "3",
      missingSmallestUnit: "3000000000000000000",
    });
    const { requests } = configureCapacityMocks([initialBalance, refreshedBalance]);
    const review = renderCapacityReview();

    expect(await screen.findByText("TVD disponibles")).toBeInTheDocument();
    expect(screen.getByText("5 TVD")).toBeInTheDocument();
    expect(screen.getByText("12 TVD")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar publicación oficial/i }),
    ).toBeDisabled();
    expect(requests[0]?.headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(requests[0]?.url).toBe("/api/v1/voting/events/evt-1/tvd-capacity");
    expect(requests[0]?.url).not.toContain("wallet");

    act(() => {
      review.store.dispatch(
        apiSlice.util.invalidateTags([{ type: "TvdEventCapacity", id: "evt-1" }]),
      );
    });
    expect(await screen.findByText("9 TVD")).toBeInTheDocument();
    expect(screen.queryByText("5 TVD")).not.toBeInTheDocument();
    expect(requests).toHaveLength(2);
  });
});
