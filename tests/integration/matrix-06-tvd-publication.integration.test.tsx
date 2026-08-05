import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configurePublicationMocks,
  createCapacityFixture,
  createPublicationRequest,
  publicationNavigate,
  renderPublicationReview,
  resetPublicationMocks,
} from "./helpers/mx06/publicationHarness";

async function preparePublication(user: ReturnType<typeof userEvent.setup>) {
  const publicationAction =
    screen.queryByRole("button", { name: /Confirmar publicación oficial/i }) ??
    screen.getByRole("button", { name: /Reintentar publicación/i });
  await user.click(publicationAction);
  await user.click(screen.getByRole("button", { name: /Publicar oficialmente/i }));
}

describe("MX-06 | publicación oficial TVD", () => {
  afterEach(() => {
    vi.useRealTimers();
    resetPublicationMocks();
  });

  it("[MX-06][TVD-PUB-P0-001][INTEGRACION] permite revisar el borrador sin exigir saldo ni preparar publicación", async () => {
    configurePublicationMocks({ eventState: "DRAFT" });
    renderPublicationReview();

    expect(await screen.findByRole("heading", { name: "Revisión antes de publicar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Estado general" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Notificar a los votantes/i })).toBeEnabled();
    expect(screen.queryByText("Falta saldo para publicar")).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-PUB-P0-002][INTEGRACION] bloquea publicación cuando el padrón no está confirmado", async () => {
    const { createRequest } = configurePublicationMocks({ padronReady: false });
    const user = userEvent.setup();
    renderPublicationReview();

    await user.click(screen.getByRole("button", { name: /Avisos importantes/i }));
    expect(screen.getByText(/Faltan estos puntos antes de notificar/i)).toBeInTheDocument();
    expect(screen.getByText("Padrón cargado")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar publicación oficial/i }),
    ).toBeDisabled();
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("[MX-06][TVD-PUB-P0-003][INTEGRACION] muestra déficit autoritativo y dirige a recarga sin éxito falso", async () => {
    const { createRequest, capacityRequests } = configurePublicationMocks({
      capacityResponses: [
        createCapacityFixture({ availableTokens: "5", missingTokens: "7", canPublish: false, reasonCode: "INSUFFICIENT_TVD_BALANCE" }),
      ],
    });
    const user = userEvent.setup();
    renderPublicationReview();

    expect(await screen.findByText("Falta saldo para publicar")).toBeInTheDocument();
    expect(screen.getByText("12 TVD")).toBeInTheDocument();
    expect(screen.getByText("5 TVD")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recargar tokens" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar publicación oficial/i }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Recargar tokens" }));
    expect(publicationNavigate).toHaveBeenCalledWith("/votacion/recarga-operativa");
    expect(createRequest).not.toHaveBeenCalled();
    expect(capacityRequests[0]?.url).toBe("/api/v1/voting/events/evt-1/tvd-capacity");
  });

  it("[MX-06][TVD-PUB-P0-004][INTEGRACION] habilita capacidad suficiente y prepara una sola solicitud", async () => {
    const user = userEvent.setup();
    const request = createPublicationRequest();
    const { createRequest, setRequest, capacityRequests } = configurePublicationMocks({
      createResponse: { created: true, request },
    });
    const review = renderPublicationReview();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Confirmar publicación oficial/i }),
      ).toBeEnabled();
    });
    await preparePublication(user);
    expect(createRequest).toHaveBeenCalledTimes(1);
    expect(createRequest).toHaveBeenCalledWith({ eventId: "evt-1" });
    expect(capacityRequests[0]?.headers.get("Authorization")).toBe("Bearer jwt-token");
    setRequest(request);
    review.unmount();
    renderPublicationReview();
    expect(screen.getByRole("button", { name: /Esperando confirmación móvil/i })).toBeDisabled();
  });

  it("[MX-06][TVD-PUB-P0-005][INTEGRACION] bloquea una preparación con preflight económico obsoleto", async () => {
    const user = userEvent.setup();
    const { createRequest } = configurePublicationMocks({
      createError: { status: 409, data: { code: "OFFICIAL_PUBLICATION_PRECHECK_STALE" } },
    });
    renderPublicationReview();

    await preparePublication(user);
    expect(createRequest).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Esperando confirmación móvil/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/signerWallet|privateKey|callData/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Operación fallida/i)).not.toHaveLength(0);
  });

  it("[MX-06][TVD-PUB-P0-006][INTEGRACION] crea y muestra una solicitud activa persistida", async () => {
    const user = userEvent.setup();
    const request = createPublicationRequest();
    const { createRequest, setRequest } = configurePublicationMocks({
      createResponse: { created: true, request },
    });
    const review = renderPublicationReview();

    await preparePublication(user);
    expect(createRequest).toHaveBeenCalledWith({ eventId: "evt-1" });
    setRequest(request);
    review.unmount();
    renderPublicationReview();
    await user.click(screen.getByRole("button", { name: /Avisos importantes/i }));
    expect(screen.getByText("Solicitud de publicación oficial")).toBeInTheDocument();
    expect(screen.getByText("ID: opr-1")).toBeInTheDocument();
    expect(screen.getByText("Esperando confirmación desde la aplicación móvil.")).toBeInTheDocument();
  });

  it("[MX-06][TVD-PUB-P0-007][INTEGRACION] reutiliza una solicitud activa sin duplicar la operación", async () => {
    const existing = createPublicationRequest("PENDING_APPROVAL", { requestId: "opr-existing" });
    const { createRequest } = configurePublicationMocks({ activeRequest: existing });
    const user = userEvent.setup();
    renderPublicationReview();

    expect(screen.getByRole("button", { name: /Esperando confirmación móvil/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Avisos importantes/i }));
    expect(screen.getByText("ID: opr-existing")).toBeInTheDocument();
    expect(screen.getAllByText("Solicitud de publicación oficial")).toHaveLength(1);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("[MX-06][TVD-PUB-P0-008][INTEGRACION] espera firma móvil sin exponer material sensible y permite polling", async () => {
    vi.useFakeTimers();
    const active = createPublicationRequest("PENDING_APPROVAL");
    const { createRequest, refetchActive } = configurePublicationMocks({ activeRequest: active });
    renderPublicationReview();

    expect(screen.getByRole("button", { name: /Esperando confirmación móvil/i })).toBeDisabled();
    expect(screen.queryByText(active.signerWallet)).not.toBeInTheDocument();
    expect(screen.queryByText(/privateKey|signature|callData/i)).not.toBeInTheDocument();
    refetchActive.mockClear();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(refetchActive).toHaveBeenCalledTimes(1);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("[MX-06][TVD-PUB-P0-011][INTEGRACION] refleja publicación confirmada y bloquea una nueva preparación", async () => {
    const completed = createPublicationRequest("COMPLETED", { txHash: "0xpublicevidence" });
    const { createRequest } = configurePublicationMocks({
      eventState: "OFFICIALLY_PUBLISHED",
      activeRequest: completed,
    });
    const user = userEvent.setup();
    renderPublicationReview();

    expect(await screen.findByRole("button", { name: "Publicación oficial confirmada" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Avisos importantes/i }));
    expect(screen.getByText("La votación fue publicada oficialmente.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver transacción" })).toHaveAttribute("href", expect.stringContaining("0xpublicevidence"));
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("[MX-06][TVD-PUB-P0-012][INTEGRACION] conserva el contexto ante fallo recuperable y permite un reintento", async () => {
    const retryable = createPublicationRequest("FAILED_RETRYABLE", {
      requestId: "opr-retryable",
      errorCode: "RPC_TIMEOUT",
    });
    const user = userEvent.setup();
    const { createRequest, setRequest } = configurePublicationMocks({
      latestAttempt: retryable,
      createResponse: { created: false, request: retryable },
    });
    const review = renderPublicationReview();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reintentar publicación" })).toBeEnabled();
    });
    await preparePublication(user);
    expect(createRequest).toHaveBeenCalledTimes(1);
    setRequest(retryable);
    review.unmount();
    renderPublicationReview();
    await user.click(screen.getByRole("button", { name: /Avisos importantes/i }));
    expect(await screen.findByText("No se pudo completar la publicación. Puedes volver a intentarlo.")).toBeInTheDocument();
    expect(screen.queryByText(/RPC_TIMEOUT|privateKey|callData/i)).not.toBeInTheDocument();
    expect(screen.queryByText("La votación fue publicada oficialmente.")).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-PUB-P0-013][INTEGRACION] consolida respuestas finales repetidas en un único estado visible", async () => {
    const completed = createPublicationRequest("COMPLETED", { txHash: "0xsameevidence" });
    const { createRequest, setRequest } = configurePublicationMocks({
      eventState: "OFFICIALLY_PUBLISHED",
      activeRequest: completed,
    });
    const first = renderPublicationReview();
    expect(await screen.findByRole("button", { name: "Publicación oficial confirmada" })).toBeDisabled();
    first.unmount();
    setRequest(completed);
    renderPublicationReview();

    expect(screen.getAllByRole("button", { name: "Publicación oficial confirmada" })).toHaveLength(1);
    expect(screen.queryByText("Esperando confirmación móvil")).not.toBeInTheDocument();
    expect(publicationNavigate).not.toHaveBeenCalled();
    expect(createRequest).not.toHaveBeenCalled();
  });
});
