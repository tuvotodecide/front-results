import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { apiSlice } from "@/store/apiSlice";
import {
  configureSecurityUiMocks,
  createSecurityCapacity,
  createSecurityFixtures,
  createSecurityPublication,
  renderSecurityRecharge,
  renderSecurityReview,
  renderUnauthorizedSecurityRecharge,
  resetSecurityUiMocks,
  securityNavigate,
  securityVisualBalanceRefetch,
} from "./helpers/mx06/securityUiHarness";

async function createConfirmedQr(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText("Monto BOB a pagar"));
  await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
  await screen.findByText("4.2 TVD");
  await user.click(screen.getByRole("button", { name: /Generar QR/i }));
}

describe("MX-06 | seguridad y estados UI TVD", () => {
  afterEach(() => resetSecurityUiMocks());

  it("[MX-06][TVD-SEC-P0-001][INTEGRACION] bloquea recarga institucional para usuario sin contexto autorizado", () => {
    const { fetchCalls } = configureSecurityUiMocks();
    renderUnauthorizedSecurityRecharge();

    expect(screen.getByText("Tu usuario no tiene acceso institucional aprobado.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/resultados");
    expect(screen.queryByText("Recarga operativa")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Generar QR/i })).not.toBeInTheDocument();
    expect(fetchCalls).toHaveLength(0);
  });

  it("[MX-06][TVD-UI-P1-001][INTEGRACION] diferencia pago, acreditación, capacidad, firma y publicación final", async () => {
    const user = userEvent.setup();
    const fixtures = createSecurityFixtures();
    const control = configureSecurityUiMocks({
      paymentDetails: { "payment-1": [fixtures.confirmedPayment] },
      capacityResponses: [createSecurityCapacity()],
    });
    const recharge = renderSecurityRecharge();

    await createConfirmedQr(user);
    expect(await screen.findByText("Procesando tokens")).toBeInTheDocument();
    expect(screen.getByText("Pago recibido; tokens en proceso.")).toBeInTheDocument();
    expect(screen.getByText("123456")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    recharge.unmount();

    const deficitReview = renderSecurityReview();
    expect(await screen.findByText("Falta saldo para publicar")).toBeInTheDocument();
    expect(screen.getByText("5 TVD")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar publicación oficial/i })).toBeDisabled();
    deficitReview.unmount();

    control.setPublication(createSecurityPublication("PENDING_APPROVAL"));
    const signingReview = renderSecurityReview();
    expect(screen.getByRole("button", { name: /Esperando confirmación móvil/i })).toBeDisabled();
    signingReview.unmount();

    control.setPublication(createSecurityPublication("COMPLETED", { txHash: "0xfinal" }));
    control.setEventState("OFFICIALLY_PUBLISHED");
    renderSecurityReview();
    expect(await screen.findByRole("button", { name: "Publicación oficial confirmada" })).toBeDisabled();
    expect(screen.queryByText("Pago recibido; tokens en proceso.")).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-UI-P1-002][INTEGRACION] conserva el contexto ante error temporal del proveedor sin éxito falso", async () => {
    const user = userEvent.setup();
    const { fetchCalls } = configureSecurityUiMocks({
      createQr: () => new Response(JSON.stringify({ code: "PROVIDER_TIMEOUT" }), { status: 503, headers: { "Content-Type": "application/json" } }),
    });
    renderSecurityRecharge();

    await createConfirmedQr(user);
    expect(await screen.findByText("El servicio no está disponible temporalmente. Reintenta en unos segundos.")).toBeInTheDocument();
    expect(screen.getByLabelText("Monto BOB a pagar")).toHaveValue("10.50");
    expect(screen.getByRole("button", { name: /Generar QR/i })).toBeEnabled();
    expect(fetchCalls.filter((call) => call.url.endsWith("/payments/qr"))).toHaveLength(1);
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    expect(screen.queryByText(/privateKey|signature|callData|stack/i)).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-UI-P1-003][INTEGRACION] vuelve de recarga a revisión y habilita sólo tras refetch acreditado", async () => {
    const user = userEvent.setup();
    const fixtures = createSecurityFixtures();
    const { fetchCalls } = configureSecurityUiMocks({
      paymentDetails: { "payment-1": [fixtures.confirmedPayment] },
      capacityResponses: [
        createSecurityCapacity(),
        createSecurityCapacity(),
        createSecurityCapacity({ availableTokens: "20", availableSmallestUnit: "20000000000000000000", missingTokens: "0", missingSmallestUnit: "0", canPublish: true, reasonCode: null }),
      ],
    });
    const initialReview = renderSecurityReview();

    expect(await screen.findByText("Falta saldo para publicar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Recargar tokens" }));
    expect(securityNavigate).toHaveBeenCalledWith("/votacion/recarga-operativa");
    initialReview.unmount();

    const recharge = renderSecurityRecharge();
    await createConfirmedQr(user);
    expect(await screen.findByText("Pago recibido; tokens en proceso.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actualizar saldo" }));
    expect(securityVisualBalanceRefetch).toHaveBeenCalledTimes(1);
    recharge.unmount();

    const returnedReview = renderSecurityReview();
    expect(await screen.findByText("Falta saldo para publicar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar publicación oficial/i })).toBeDisabled();
    act(() => {
      returnedReview.store.dispatch(apiSlice.util.invalidateTags([{ type: "TvdEventCapacity", id: "evt-1" }]));
    });
    await waitFor(() => expect(screen.getByRole("button", { name: /Confirmar publicación oficial/i })).toBeEnabled());
    expect(fetchCalls.filter((call) => call.url.endsWith("/voting/events/evt-1/tvd-capacity"))).toHaveLength(3);
    expect(screen.queryByText("Pago recibido; tokens en proceso.")).not.toBeInTheDocument();
  });
});
