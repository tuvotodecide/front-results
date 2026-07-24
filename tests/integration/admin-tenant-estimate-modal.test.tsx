import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { vi } from "vitest";
import EstimateVotersModal from "@/features/adminTvd/components/EstimateVotersModal";
import { renderWithAuthStore } from "../utils/renderWithStore";

type FetchCall = {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
};

const fetchCalls: FetchCall[] = [];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const capacityResponse = {
  estimatedParticipants: "10",
  tokensPerParticipant: "1",
  estimatedRequiredTokens: "10",
  estimatedRequiredSmallestUnit: "10000000000000000000",
  availableTokens: "20",
  availableSmallestUnit: "20000000000000000000",
  estimatedMissingTokens: "0",
  estimatedMissingSmallestUnit: "0",
  hasEstimatedCapacity: true,
  reasonCode: null,
  balanceSource: "BLOCKCHAIN",
  usableBalanceField: "totalBalanceSmallestUnit",
  walletAddress: "0x1111111111111111111111111111111111111111",
} as const;

const insufficientCapacityResponse = {
  ...capacityResponse,
  estimatedParticipants: "50",
  estimatedRequiredTokens: "50",
  estimatedRequiredSmallestUnit: "50000000000000000000",
  availableTokens: "20",
  estimatedMissingTokens: "30",
  estimatedMissingSmallestUnit: "30000000000000000000",
  hasEstimatedCapacity: false,
  reasonCode: "INSUFFICIENT_TVD_BALANCE",
} as const;

const installFetchMock = (response: unknown = capacityResponse, status = 200) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    fetchCalls.push({
      url: `${url.pathname}${url.search}`,
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? null : await request.text(),
    });

    if (url.pathname.endsWith("/tvd/me/estimated-capacity")) {
      return jsonResponse(response, status);
    }

    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const renderEstimateModal = (
  props?: Partial<ComponentProps<typeof EstimateVotersModal>>,
) =>
  renderWithAuthStore(
    <EstimateVotersModal
      isOpen
      onClose={vi.fn()}
      onContinue={vi.fn()}
      onRecharge={vi.fn()}
      {...props}
    />,
    {
      token: "jwt-token",
      accessToken: "jwt-token",
      role: "TENANT_ADMIN",
      active: true,
      tenantId: "tenant-1",
      activeContext: {
        type: "TENANT",
        tenantId: "tenant-1",
        tenantName: "Colegio Demo",
        role: "TENANT_ADMIN",
      },
      user: {
        id: "user-1",
        email: "admin@demo.bo",
        name: "Admin Demo",
        role: "TENANT_ADMIN",
        active: true,
        tenantId: "tenant-1",
        tenantName: "Colegio Demo",
      },
    },
  );

describe("Admin tenant estimate and insufficient balance modals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCalls.length = 0;
    installFetchMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consulta capacidad estimada real y permite crear borrador con saldo suficiente", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    renderEstimateModal({ onContinue });

    await user.type(
      screen.getByLabelText("¿Cuántos participantes estima que tendrá esta elección?"),
      "10",
    );
    await user.click(screen.getByRole("button", { name: "Validar capacidad" }));

    expect(await screen.findByText("10 TVD")).toBeInTheDocument();
    expect(screen.getByText("20 TVD")).toBeInTheDocument();
    expect(
      screen.getByText("La wallet tiene capacidad estimada para esta elección."),
    ).toBeInTheDocument();

    const posts = fetchCalls.filter((call) =>
      call.url.endsWith("/tvd/me/estimated-capacity"),
    );
    expect(posts).toHaveLength(1);
    expect(posts[0].headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(posts[0].headers.get("x-api-key")).toBeNull();

    const body = JSON.parse(posts[0].body ?? "{}") as Record<string, unknown>;
    expect(body).toEqual({ estimatedParticipants: "10" });
    expect(body.walletAddress).toBeUndefined();
    expect(body.availableTokens).toBeUndefined();
    expect(body.canPublish).toBeUndefined();

    await user.click(screen.getByRole("button", { name: "Crear borrador" }));
    expect(onContinue).toHaveBeenCalledWith(capacityResponse);
  });

  it("bloquea vacios, espacios, cero, negativos, decimales, texto y notacion cientifica", async () => {
    const user = userEvent.setup();
    renderEstimateModal();

    const input = screen.getByLabelText(
      "¿Cuántos participantes estima que tendrá esta elección?",
    );
    const validateButton = screen.getByRole("button", {
      name: "Validar capacidad",
    });

    expect(validateButton).toBeDisabled();

    for (const value of ["   ", "0", "-1", "1.5", "abc", "1e3"]) {
      await user.clear(input);
      await user.type(input, value);
      expect(validateButton).toBeDisabled();
    }

    expect(fetchCalls).toHaveLength(0);
  });

  it("muestra advertencia por saldo insuficiente sin bloquear el borrador", async () => {
    installFetchMock(insufficientCapacityResponse);
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const onRecharge = vi.fn();
    renderEstimateModal({ onContinue, onRecharge });

    await user.type(
      screen.getByLabelText("¿Cuántos participantes estima que tendrá esta elección?"),
      "50",
    );
    await user.click(screen.getByRole("button", { name: "Validar capacidad" }));

    expect(
      await screen.findByText(/El saldo actual no cubre la estimación/i),
    ).toBeInTheDocument();
    expect(screen.getByText("30 TVD")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir a recarga operativa" }));
    expect(onRecharge).toHaveBeenCalledWith(insufficientCapacityResponse);

    await user.click(
      screen.getByRole("button", { name: "Crear borrador de todos modos" }),
    );
    expect(onContinue).toHaveBeenCalledWith(insufficientCapacityResponse);
  });

  it("permite retry cuando backend o RPC no estan disponibles", async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock(
      { code: "TVD_CAPACITY_UNAVAILABLE" },
      503,
    );
    renderEstimateModal();

    await user.type(
      screen.getByLabelText("¿Cuántos participantes estima que tendrá esta elección?"),
      "10",
    );
    await user.click(screen.getByRole("button", { name: "Validar capacidad" }));

    expect(
      await screen.findByText("No pudimos validar el saldo actual. Intenta nuevamente."),
    ).toBeInTheDocument();

    fetchMock.mockImplementationOnce(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);
      fetchCalls.push({
        url: `${url.pathname}${url.search}`,
        method: request.method,
        headers: request.headers,
        body: request.method === "GET" ? null : await request.text(),
      });
      return jsonResponse(capacityResponse);
    });
    await user.click(screen.getByRole("button", { name: "Validar capacidad" }));

    await waitFor(() => {
      expect(screen.getByText("La wallet tiene capacidad estimada para esta elección.")).toBeInTheDocument();
    });
  });

  it("evita doble submit mientras una validacion esta en curso", async () => {
    let resolveCapacity: (response: Response) => void = () => undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveCapacity = resolve;
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);
      fetchCalls.push({
        url: `${url.pathname}${url.search}`,
        method: request.method,
        headers: request.headers,
        body: request.method === "GET" ? null : await request.text(),
      });
      return pendingResponse;
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderEstimateModal();

    await user.type(
      screen.getByLabelText("¿Cuántos participantes estima que tendrá esta elección?"),
      "10",
    );
    await user.dblClick(screen.getByRole("button", { name: "Validar capacidad" }));

    expect(
      fetchCalls.filter((call) => call.url.endsWith("/tvd/me/estimated-capacity")),
    ).toHaveLength(1);

    resolveCapacity(jsonResponse(capacityResponse));
    expect(
      await screen.findByText("La wallet tiene capacidad estimada para esta elección."),
    ).toBeInTheDocument();
  });

  it("descarta respuestas obsoletas si cambia la estimacion antes de resolver", async () => {
    let resolveFirstCapacity: (response: Response) => void = () => undefined;
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirstCapacity = resolve;
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);
      fetchCalls.push({
        url: `${url.pathname}${url.search}`,
        method: request.method,
        headers: request.headers,
        body: request.method === "GET" ? null : await request.text(),
      });

      if (fetchCalls.length === 1) {
        return firstResponse;
      }

      return jsonResponse(insufficientCapacityResponse);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderEstimateModal();

    const input = screen.getByLabelText(
      "¿Cuántos participantes estima que tendrá esta elección?",
    );
    await user.type(input, "10");
    await user.click(screen.getByRole("button", { name: "Validar capacidad" }));
    await user.clear(input);
    await user.type(input, "50");

    resolveFirstCapacity(jsonResponse(capacityResponse));
    await waitFor(() => {
      expect(
        screen.queryByText("La wallet tiene capacidad estimada para esta elección."),
      ).not.toBeInTheDocument();
    });

    await user.click(
      await screen.findByRole("button", { name: "Validar capacidad" }),
    );

    expect(
      await screen.findByText(/El saldo actual no cubre la estimación/i),
    ).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
