import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import TvdWalletLookupPage from "@/domains/superadmin/screens/TvdWalletLookupPage";
import type { AuthState } from "@/store/auth/authSlice";
import type { TvdWalletLookupResponse } from "@/store/tvd";
import { renderWithAuthStore } from "../utils/renderWithStore";

const associatedResponse: TvdWalletLookupResponse = {
  accountAddress: "0x1234567890AbcdEF1234567890aBcdef12345678",
  registeredInIdentity: true,
  identityStatus: "REGISTERED",
  associationStatus: "ASSOCIATED",
  canUse: true,
  reasonCode: "WALLET_ASSOCIATED",
  associations: [
    {
      tenantId: "tenant-1",
      tenantName: "Tribunal Supremo Electoral",
      tenantActive: true,
      assignmentId: "assignment-1",
      userId: "user-1",
      institutionalRole: "TENANT_ADMIN",
      assignmentStatus: "APPROVED",
      assignmentActive: true,
      userActive: true,
      walletStatus: "VERIFIED",
      walletVerifiedAt: "2026-07-21T10:00:00.000Z",
      walletVerificationSource: "IDENTITY",
    },
    {
      tenantId: "tenant-2",
      tenantName: "Municipio de La Paz",
      tenantActive: true,
      assignmentId: "assignment-2",
      userId: "user-2",
      institutionalRole: "TENANT_ADMIN",
      assignmentStatus: "APPROVED",
      assignmentActive: true,
      userActive: true,
      walletStatus: "VERIFIED",
      walletVerifiedAt: "2026-07-22T10:00:00.000Z",
      walletVerificationSource: "IDENTITY",
    },
  ],
};

const renderLookupPage = (authState?: Partial<AuthState>) => {
  return renderWithAuthStore(<TvdWalletLookupPage />, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
    availableContexts: [
      {
        type: "GLOBAL_ADMIN",
        role: "SUPERADMIN",
        label: "Global",
      },
    ],
    activeContext: {
      type: "GLOBAL_ADMIN",
      role: "SUPERADMIN",
      label: "Global",
    },
    user: {
      id: "superadmin-1",
      email: "superadmin@test.dev",
      name: "Superadmin",
      role: "SUPERADMIN",
      active: true,
    },
    ...authState,
  });
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const requestFromFetch = (
  fetchMock: ReturnType<typeof vi.fn<(input: RequestInfo | URL) => Promise<Response>>>,
) => fetchMock.mock.calls[0]?.[0];

describe("Superadmin wallet lookup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no ejecuta la consulta al montar y valida entradas inválidas", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL) => jsonResponse(associatedResponse),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderLookupPage();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Ingresa una dirección de wallet para verificar/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    expect(screen.getByText("Ingresa una dirección de wallet.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Dirección de wallet/i), "0x123");
    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    expect(
      screen.getByText("La dirección de wallet no es válida."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Dirección de wallet/i));
    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x0000000000000000000000000000000000000000",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    expect(
      screen.getByText("La dirección de wallet no es válida."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("consulta Backend Results con Authorization y sin x-api-key ni tenant arbitrario", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL) => jsonResponse(associatedResponse),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderLookupPage();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234567890abcdef1234567890abcdef12345678",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));

    expect(
      (await screen.findAllByText("Wallet registrada y asociada")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("0x1234567890AbcdEF1234567890aBcdef12345678")).toBeInTheDocument();
    expect(screen.getByText("Tribunal Supremo Electoral")).toBeInTheDocument();
    expect(screen.getByText("Municipio de La Paz")).toBeInTheDocument();

    const request = requestFromFetch(fetchMock);
    expect(request).toBeInstanceOf(Request);
    const url = request instanceof Request ? new URL(request.url) : null;
    expect(url?.pathname).toBe("/api/v1/tvd/admin/wallet-lookup");
    expect(url?.searchParams.get("accountAddress")).toBe(
      "0x1234567890abcdef1234567890abcdef12345678",
    );
    expect(url?.searchParams.has("tenantId")).toBe(false);
    if (request instanceof Request) {
      expect(request.headers.get("authorization")).toBe(
        "Bearer superadmin-token",
      );
      expect(request.headers.get("x-api-key")).toBeNull();
    }
    expect(screen.queryByText(/DNI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/discoverableHash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IDENTITY_API_KEY/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Saldo")).not.toBeInTheDocument();
    expect(screen.queryByText("100 $TVD")).not.toBeInTheDocument();
  });

  it.each([
    [
      "wallet registrada sin asociación",
      {
        ...associatedResponse,
        associations: [],
        associationStatus: "UNASSOCIATED",
        reasonCode: "WALLET_AVAILABLE",
      } satisfies TvdWalletLookupResponse,
      "Wallet registrada y disponible",
    ],
    [
      "wallet no registrada",
      {
        ...associatedResponse,
        registeredInIdentity: false,
        identityStatus: "NOT_REGISTERED",
        associations: [],
        associationStatus: "UNASSOCIATED",
        canUse: false,
        reasonCode: "WALLET_NOT_REGISTERED",
      } satisfies TvdWalletLookupResponse,
      "Wallet no registrada",
    ],
    [
      "wallet deshabilitada",
      {
        ...associatedResponse,
        associationStatus: "DISABLED",
        canUse: false,
        reasonCode: "WALLET_DISABLED",
      } satisfies TvdWalletLookupResponse,
      "Wallet no disponible",
    ],
    [
      "wallet incompatible",
      {
        ...associatedResponse,
        associationStatus: "INCOMPATIBLE",
        canUse: false,
        reasonCode: "WALLET_INCOMPATIBLE",
      } satisfies TvdWalletLookupResponse,
      "Wallet incompatible",
    ],
  ])("muestra estado para %s", async (_caseName, response, expectedMessage) => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL) => jsonResponse(response)),
    );

    renderLookupPage();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234567890abcdef1234567890abcdef12345678",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));

    expect((await screen.findAllByText(expectedMessage)).length).toBeGreaterThan(
      0,
    );
  });

  it("reintenta después de un error temporal y conserva la dirección", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn(async (_input: RequestInfo | URL) => jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse(associatedResponse));
    vi.stubGlobal("fetch", fetchMock);

    renderLookupPage();

    const input = screen.getByLabelText(/Dirección de wallet/i);
    await user.type(input, "0x1234567890abcdef1234567890abcdef12345678");
    await user.click(screen.getByRole("button", { name: /Consultar/i }));

    expect(
      await screen.findByText("No pudimos validar la wallet. Intenta nuevamente."),
    ).toBeInTheDocument();
    expect(input).toHaveValue("0x1234567890abcdef1234567890abcdef12345678");

    await user.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect(
      (await screen.findAllByText("Wallet registrada y asociada")).length,
    ).toBeGreaterThan(0);
  });

  it("no deja visible el resultado anterior cuando una nueva búsqueda falla", async () => {
    const user = userEvent.setup();
    const secondAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    const fetchMock = vi
      .fn(async (_input: RequestInfo | URL) => jsonResponse(associatedResponse))
      .mockResolvedValueOnce(jsonResponse(associatedResponse))
      .mockResolvedValueOnce(jsonResponse({}, 500));
    vi.stubGlobal("fetch", fetchMock);

    renderLookupPage();

    const input = screen.getByLabelText(/Dirección de wallet/i);
    await user.type(input, "0x1234567890abcdef1234567890abcdef12345678");
    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    expect(await screen.findByText("Tribunal Supremo Electoral")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, secondAddress);
    expect(screen.queryByText("Tribunal Supremo Electoral")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Consultar/i }));

    expect(
      await screen.findByText("El servicio no está disponible. Intenta nuevamente."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tribunal Supremo Electoral")).not.toBeInTheDocument();
  });

  it("evita doble submit de la misma dirección mientras la consulta está pendiente", async () => {
    const user = userEvent.setup();
    let resolveResponse: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL) =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderLookupPage();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234567890abcdef1234567890abcdef12345678",
    );
    await user.dblClick(screen.getByRole("button", { name: /Consultar/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Consultando wallet");

    resolveResponse(jsonResponse(associatedResponse));
    expect(
      (await screen.findAllByText("Wallet registrada y asociada")).length,
    ).toBeGreaterThan(0);
  });

  it("muestra 403 seguro sin reintento automático", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL) => jsonResponse({}, 403)),
    );

    renderLookupPage();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234567890abcdef1234567890abcdef12345678",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));

    const alert = await screen.findByText(
      "No tienes permisos para consultar wallets globalmente.",
    );
    expect(alert).toBeInTheDocument();
    expect(within(alert.closest("div") ?? document.body).queryByText(/stack/i)).not.toBeInTheDocument();
  });
});
