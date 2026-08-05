import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiSlice } from "@/store/apiSlice";
import {
  configureRechargeMocks,
  createRechargeFixtures,
  jsonResponse,
  renderRechargePage,
  resetRechargeMocks,
  visualBalanceRefetch,
} from "./helpers/mx06/rechargeHarness";

const amountInputName = "Monto BOB a pagar";

async function requestQuote(user: ReturnType<typeof userEvent.setup>, amount = "10.50") {
  const amountInput = screen.getByLabelText(amountInputName);
  await user.clear(amountInput);
  await user.type(amountInput, amount);
  await screen.findByText(`${amount === "11" ? "4" : "4.2"} TVD`);
}

async function createQr(user: ReturnType<typeof userEvent.setup>, amount = "10.50") {
  await requestQuote(user, amount);
  await user.click(screen.getByRole("button", { name: /Generar QR/i }));
}

describe("MX-06 | recarga QR TVD", () => {
  afterEach(() => {
    resetRechargeMocks();
  });

  it("[MX-06][TVD-QR-P0-001][INTEGRACION] consulta una cotización válida en el contexto institucional", async () => {
    const user = userEvent.setup();
    const { fetchCalls } = configureRechargeMocks();

    renderRechargePage();
    await requestQuote(user);

    expect(screen.getByText("Bs. 10.50")).toBeInTheDocument();
    expect(screen.getByText("1 TVD = 2.5 Bs.")).toBeInTheDocument();
    expect(
      fetchCalls.some((call) =>
        call.url.includes("/tvd/me/quote?amount=10.50&currency=BOB"),
      ),
    ).toBe(true);
    expect(
      fetchCalls.some((call) => call.url.includes("/tvd/me/summary")),
    ).toBe(true);
    const summaryCall = fetchCalls.find((call) => call.url.includes("/tvd/me/summary"));
    expect(summaryCall?.headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(
      fetchCalls.some((call) => call.url.includes("wallet=")),
    ).toBe(false);
  });

  it("[MX-06][TVD-QR-P0-002][INTEGRACION] crea un QR con referencia y sin wallet manipulada", async () => {
    const user = userEvent.setup();
    const { fetchCalls } = configureRechargeMocks();

    renderRechargePage();
    await createQr(user);

    expect(await screen.findByAltText("Código QR para pagar la recarga TVD")).toBeInTheDocument();
    expect(screen.getByText("123456")).toBeInTheDocument();
    expect(screen.getByText("Bs. 10.50")).toBeInTheDocument();
    expect(screen.getByText(/Escanea el QR desde tu banca móvil/i)).toBeInTheDocument();
    const posts = fetchCalls.filter((call) => call.url.endsWith("/payments/qr"));
    expect(posts).toHaveLength(1);
    expect(posts[0].headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(JSON.parse(posts[0].body ?? "{}")).toEqual({
      amount: "10.50",
      currency: "BOB",
      description: "Recarga operativa",
    });
    expect(posts[0].body).not.toContain("wallet");
  });

  it("[MX-06][TVD-QR-P0-003][INTEGRACION] conserva el contexto ante timeout, proveedor no disponible y QR inválido", async () => {
    const user = userEvent.setup();
    const fixtures = createRechargeFixtures();
    let attempts = 0;
    configureRechargeMocks({
      createQr: () => {
        attempts += 1;
        if (attempts < 3) {
          return jsonResponse({ code: attempts === 1 ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE" }, 503);
        }
        return jsonResponse({ ...fixtures.qrPayment, qrImage: "imagen-no-valida" });
      },
      paymentDetails: {
        "payment-1": [{ ...fixtures.activePayment, qrImage: "imagen-no-valida" }],
      },
    });

    renderRechargePage();
    await requestQuote(user);
    const generateButton = screen.getByRole("button", { name: /Generar QR/i });
    await user.click(generateButton);
    expect(
      await screen.findByText("El servicio no está disponible temporalmente. Reintenta en unos segundos."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(amountInputName)).toHaveValue("10.50");
    await user.click(generateButton);
    expect(
      screen.getByText("El servicio no está disponible temporalmente. Reintenta en unos segundos."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(amountInputName)).toHaveValue("10.50");
    await user.click(generateButton);

    expect(await screen.findByText("La imagen QR no es válida para descarga.")).toBeInTheDocument();
    expect(screen.queryByAltText("Código QR para pagar la recarga TVD")).not.toBeInTheDocument();
    expect(screen.queryByText("Pago confirmado")).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-QR-P0-004][INTEGRACION] bloquea doble envío y separa una solicitud de payload incompatible", async () => {
    const user = userEvent.setup();
    const fixtures = createRechargeFixtures();
    let resolveFirstCreate: ((response: Response) => void) | undefined;
    const { fetchCalls } = configureRechargeMocks({
      quote: (call) => {
        const amount = new URL(call.url, "https://test.local").searchParams.get("amount");
        return jsonResponse({
          ...fixtures.quote,
          fiatAmount: amount,
          fiatAmountMinor: amount === "11.00" ? "1100" : fixtures.quote.fiatAmountMinor,
          estimatedTvd: amount === "11.00" ? "4" : fixtures.quote.estimatedTvd,
        });
      },
      createQr: () =>
        fetchCalls.filter((item) => item.url.endsWith("/payments/qr")).length === 1
          ? new Promise<Response>((resolve) => {
              resolveFirstCreate = resolve;
            })
          : jsonResponse({ ...fixtures.qrPayment, id: "payment-2", amount: "11.00" }),
    });

    renderRechargePage();
    await requestQuote(user);
    const createButton = screen.getByRole("button", { name: /Generar QR/i });
    await user.dblClick(createButton);
    expect(createButton).toBeDisabled();
    expect(fetchCalls.filter((call) => call.url.endsWith("/payments/qr"))).toHaveLength(1);
    resolveFirstCreate?.(jsonResponse(fixtures.qrPayment));
    await screen.findByAltText("Código QR para pagar la recarga TVD");

    await user.click(screen.getByRole("button", { name: /Nueva recarga/i }));
    await createQr(user, "11");
    const posts = fetchCalls.filter((call) => call.url.endsWith("/payments/qr"));
    expect(posts).toHaveLength(2);
    expect(posts[0].headers.get("Idempotency-Key")).not.toBe(posts[1].headers.get("Idempotency-Key"));
    expect(JSON.parse(posts[1].body ?? "{}")).toMatchObject({ amount: "11.00" });
  });

  it("[MX-06][TVD-QR-P1-005][INTEGRACION] descarga el QR real y vuelve al panel sin cancelar el pago", async () => {
    const user = userEvent.setup();
    const { fetchCalls } = configureRechargeMocks();
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      click,
      remove,
      set href(_value: string) {},
      set download(value: string) {
        expect(value).toBe("qr-recarga-tvd-123456.png");
      },
      set rel(value: string) {
        expect(value).toBe("noopener");
      },
    } as unknown as HTMLAnchorElement;

    renderRechargePage();
    await createQr(user);
    expect(await screen.findByAltText("Código QR para pagar la recarga TVD")).toBeInTheDocument();
    const beforeDownload = fetchCalls.length;
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(anchor);
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:qr"), revokeObjectURL: vi.fn() });
    await user.click(screen.getByRole("button", { name: /Descargar QR/i }));
    expect(click).toHaveBeenCalledOnce();
    expect(fetchCalls).toHaveLength(beforeDownload);
    createElement.mockRestore();
    appendChild.mockRestore();

    await user.click(screen.getByRole("button", { name: /Nueva recarga/i }));
    expect(screen.getByLabelText(amountInputName)).toBeInTheDocument();
    expect(screen.queryByAltText("Código QR para pagar la recarga TVD")).not.toBeInTheDocument();
    expect(screen.queryByText("Pago confirmado")).not.toBeInTheDocument();
    expect(screen.queryByText(/cancelado/i)).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-QR-P0-006][INTEGRACION] separa pago confirmado de acreditación pendiente sin saldo falso", async () => {
    const user = userEvent.setup();
    const fixtures = createRechargeFixtures();
    configureRechargeMocks({ paymentDetails: { "payment-1": [fixtures.confirmedPayment] } });

    renderRechargePage();
    await createQr(user);

    expect(await screen.findByText("Procesando tokens")).toBeInTheDocument();
    expect(screen.getByText("Pago recibido; tokens en proceso.")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    expect(visualBalanceRefetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/publicación/i)).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-QR-P0-007][INTEGRACION] conserva cero acreditación falsa ante pago rechazado, vencido o pendiente", async () => {
    const user = userEvent.setup();
    const fixtures = createRechargeFixtures();
    let creation = 0;
    configureRechargeMocks({
      createQr: () => {
        creation += 1;
        if (creation === 1) {
          return jsonResponse({ ...fixtures.qrPayment, status: "FAILED", qrImage: null });
        }
        if (creation === 2) {
          return jsonResponse({
            ...fixtures.qrPayment,
            id: "payment-2",
            status: "EXPIRED",
            qrImage: null,
            qrExpiresAt: "2000-01-01T00:00:00.000Z",
            regenerationStatus: "REGENERABLE",
            regenerationReason: "QR_EXPIRED_QUOTE_VALID",
          });
        }
        return jsonResponse({
          ...fixtures.qrPayment,
          id: "payment-3",
          status: "RECONCILIATION_PENDING",
          qrImage: null,
          regenerationStatus: "RECONCILIATION_REQUIRED",
          regenerationReason: "PAYMENT_REGENERATION_RECONCILIATION_REQUIRED",
        });
      },
      paymentDetails: {
        "payment-1": [fixtures.rejectedPayment],
        "payment-2": [
          {
            ...fixtures.expiredPayment,
            paymentId: "payment-2",
            qrExpiresAt: "2000-01-01T00:00:00.000Z",
          },
        ],
        "payment-3": [{ ...fixtures.reconciliationPayment, paymentId: "payment-3" }],
      },
    });

    renderRechargePage();
    await createQr(user);
    expect(await screen.findByText("No pudimos completar el pago.")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Nueva recarga/i }));
    await createQr(user);
    expect(await screen.findByText("El QR expiró. Genera un nuevo intento.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Regenerar QR/i })).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Nueva recarga/i }));
    await createQr(user);
    expect(await screen.findByText("Estamos verificando el estado del QR anterior.")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    expect(visualBalanceRefetch).not.toHaveBeenCalled();
  });

  it("[MX-06][TVD-QR-P0-008][INTEGRACION] deduplica callback o refetch repetido sin duplicar el resultado", async () => {
    const user = userEvent.setup();
    const fixtures = createRechargeFixtures();
    const { fetchCalls } = configureRechargeMocks({
      paymentDetails: { "payment-1": [fixtures.activePayment, fixtures.activePayment, fixtures.activePayment] },
    });
    const rendered = renderRechargePage();

    await createQr(user);
    expect(await screen.findByAltText("Código QR para pagar la recarga TVD")).toBeInTheDocument();
    act(() => {
      rendered.store.dispatch(apiSlice.util.invalidateTags([{ type: "TvdPayment", id: "payment-1" }]));
      rendered.store.dispatch(apiSlice.util.invalidateTags([{ type: "TvdPayment", id: "payment-1" }]));
    });
    await waitFor(() => {
      expect(
        fetchCalls.filter((call) => call.url.endsWith("/tvd/me/payments/payment-1")),
      ).toHaveLength(3);
    });

    expect(screen.getAllByAltText("Código QR para pagar la recarga TVD")).toHaveLength(1);
    expect(screen.getAllByText("123456")).toHaveLength(1);
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    expect(visualBalanceRefetch).not.toHaveBeenCalled();
  });

  it("[MX-06][TVD-QR-P0-009][INTEGRACION] concilia sin confirmar antes de recibir una respuesta controlada", async () => {
    const user = userEvent.setup();
    const fixtures = createRechargeFixtures();
    configureRechargeMocks({
      paymentDetails: { "payment-1": [fixtures.reconciliationPayment, fixtures.confirmedPayment] },
    });
    const { store } = renderRechargePage();

    await createQr(user);
    expect(await screen.findByText("Estamos verificando el estado del QR anterior.")).toBeInTheDocument();
    expect(screen.getByText("123456")).toBeInTheDocument();
    expect(screen.queryByText("Pago recibido; tokens en proceso.")).not.toBeInTheDocument();
    act(() => {
      store.dispatch(apiSlice.util.invalidateTags([{ type: "TvdPayment", id: "payment-1" }]));
    });

    expect(await screen.findByText("Pago recibido; tokens en proceso.")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-QR-P0-010][INTEGRACION] regenera solo con autorización y bloquea conciliación", async () => {
    const user = userEvent.setup();
    const fixtures = createRechargeFixtures();
    const regeneratedQrImage = "iVBORw0KGgoA";
    const regeneratedPayment = {
      ...fixtures.regeneratedQrPayment,
      qrImage: regeneratedQrImage,
    };
    const regeneratedDetail = {
      ...fixtures.activePayment,
      paymentId: "payment-2",
      merchantReference: "223344",
      providerReference: "443322",
      qrImage: regeneratedQrImage,
      qrExpiresAt: "2099-07-21T13:00:00.000Z",
    };
    const first = configureRechargeMocks({
      paymentDetails: {
        "payment-1": [fixtures.expiredPayment],
        "payment-2": [regeneratedDetail],
      },
      regenerateQr: () => jsonResponse(regeneratedPayment),
    });
    const rendered = renderRechargePage();

    await createQr(user);
    const regenerateButton = await screen.findByRole("button", { name: /Regenerar QR/i });
    await user.dblClick(regenerateButton);
    expect(await screen.findByText("QR regenerado. Esperando confirmación del pago.")).toBeInTheDocument();
    expect(await screen.findByText("223344")).toBeInTheDocument();
    const regeneratedQr = await screen.findByAltText("Código QR para pagar la recarga TVD");
    expect(regeneratedQr).toHaveAttribute(
      "src",
      `data:image/png;base64,${regeneratedQrImage}`,
    );
    expect(screen.getByText("Bs. 10.50")).toBeInTheDocument();
    expect(screen.queryByText("TVD acreditados correctamente.")).not.toBeInTheDocument();
    expect(
      first.fetchCalls.filter((call) =>
        call.url.endsWith("/payments/payment-1/regenerate"),
      ),
    ).toHaveLength(1);
    expect(
      first.fetchCalls.filter((call) =>
        call.url.endsWith("/tvd/me/payments/payment-2"),
      ),
    ).toHaveLength(1);
    rendered.unmount();

    resetRechargeMocks();
    configureRechargeMocks({ paymentDetails: { "payment-1": [fixtures.reconciliationPayment] } });
    renderRechargePage();
    await createQr(user);
    expect(
      await screen.findByText(
        "Estamos verificando el estado del QR anterior. No generaremos otro QR hasta resolverlo para evitar un doble pago.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Regenerar QR/i })).not.toBeInTheDocument();
  });
});
