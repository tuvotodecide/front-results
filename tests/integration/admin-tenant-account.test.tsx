import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InstitutionalAccountPage from "@/features/adminTvd/screens/InstitutionalAccountPage";
import type { AuthState } from "@/store/auth/authSlice";
import type { TvdMySummaryResponse } from "@/store/tvd";
import { renderWithAuthStore } from "../utils/renderWithStore";

const activeWallet = "0x1234567890abcdef1234567890abcdef12345678" as const;
const secondWallet = "0x2222222222222222222222222222222222222222" as const;
const activeWalletDisplay = "0x123456...345678" as const;
const secondWalletDisplay = "0x222222...222222" as const;
const PERSON_NOT_REGISTERED_MESSAGE =
  "La persona no está registrada en Tu Voto Decide.";
const ALREADY_ADMIN_MESSAGE = "Esta persona ya tiene una cuenta en la institución.";
const DUPLICATE_INVITATION_MESSAGE =
  "Ya existe una invitación pendiente para esta persona.";

const summaryResponse: TvdMySummaryResponse = {
  tenantId: "tenant-1",
  assignmentId: "assignment-1",
  wallet: activeWallet,
  walletStatus: "VERIFIED",
  assignedBalance: {
    smallestUnit: "20000000000000000000",
    formatted: "20",
    decimals: 18,
  },
  liquidBalance: {
    smallestUnit: "80000000000000000000",
    formatted: "80",
  },
  totalBalance: {
    smallestUnit: "100000000000000000000",
    formatted: "100",
  },
  tokenSymbol: "TVD",
  chainId: 84532,
  contractAddress: "0x3333333333333333333333333333333333333333",
  lastAccreditation: null,
  pendingAccreditationsCount: 0,
};

const adminsResponse = {
  tenantId: "tenant-1",
  data: [
    {
      assignmentId: "assignment-1",
      tenantId: "tenant-1",
      userId: "user-1",
      name: "Admin A",
      email: "admin@tenant.test",
      accountAddress: activeWallet,
      institutionalRole: "PRIMARY",
      status: "APPROVED",
      active: true,
      hasWallet: true,
      walletStatus: "VERIFIED",
    },
  ],
  total: 1,
};

const emptyInvitationsResponse = {
  tenantId: "tenant-1",
  data: [],
  total: 0,
};

const emptyApplicationsResponse = {
  data: [],
  total: 0,
};

const tenantAuth = (overrides?: Partial<AuthState>): Partial<AuthState> => ({
  token: "tenant-token",
  accessToken: "tenant-token",
  role: "TENANT_ADMIN",
  active: true,
  tenantId: "tenant-1",
  availableContexts: [
    {
      type: "TENANT",
      role: "TENANT_ADMIN",
      tenantId: "tenant-1",
      tenantName: "Colegio Médico",
    },
  ],
  activeContext: {
    type: "TENANT",
    role: "TENANT_ADMIN",
    tenantId: "tenant-1",
    tenantName: "Colegio Médico",
  },
  user: {
    id: "user-1",
    email: "admin@tenant.test",
    name: "Admin A",
    role: "TENANT_ADMIN",
    active: true,
    status: "ACTIVE",
    tenantId: "tenant-1",
    tenantName: "Colegio Médico",
  },
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const defaultInstitutionalAccountResponse = (request: Request) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/v1/tvd/me/summary") {
    return jsonResponse(summaryResponse);
  }
  const adminsMatch = url.pathname.match(/^\/api\/v1\/institutional-tenants\/([^/]+)\/admins$/);
  if (adminsMatch) {
    if (adminsMatch[1] !== "tenant-1") {
      return jsonResponse({ tenantId: adminsMatch[1], data: [], total: 0 });
    }
    return jsonResponse({
      ...adminsResponse,
      tenantId: adminsMatch[1],
      data: adminsResponse.data.map((admin) => ({
        ...admin,
        tenantId: adminsMatch[1],
      })),
    });
  }
  const transferMatch = url.pathname.match(
    /^\/api\/v1\/institutional-tenants\/([^/]+)\/primary\/transfer$/,
  );
  if (transferMatch) {
    return jsonResponse({
      tenantId: transferMatch[1],
      transferId: "transfer-1",
      applicationId: "transfer-1",
      targetAssignmentId: "assignment-2",
      previousPrimaryUserId: "user-1",
      targetUserId: "user-2",
      status: "PENDING_MOBILE_AUTHORIZATION",
      mobileAuthorizationAction: "CHANGE_INSTITUTION_ADMIN",
      mobileAuthorizationStatus: "PENDING_MOBILE_AUTHORIZATION",
      stableInstitutionId: "tenant-1",
      targetWallet: secondWallet,
      signerWallet: activeWallet,
      expiresAt: "2026-08-04T12:00:00.000Z",
    }, 201);
  }
  const invitationsMatch = url.pathname.match(
    /^\/api\/v1\/institutional-admin-applications\/tenants\/([^/]+)\/invitations$/,
  );
  if (invitationsMatch) {
    return jsonResponse({
      ...emptyInvitationsResponse,
      tenantId: invitationsMatch[1],
    });
  }
  if (url.pathname === "/api/v1/institutional-admin-applications") {
    return jsonResponse(emptyApplicationsResponse);
  }
  throw new Error(`Unexpected request: ${request.method} ${url.pathname}`);
};

const setupFetch = (
  handler?: (request: Request) => Response | undefined | Promise<Response | undefined>,
) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (!(input instanceof Request)) {
      throw new Error("Expected Request");
    }
    const customResponse = await handler?.(input);
    return customResponse ?? defaultInstitutionalAccountResponse(input);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("MX-02 | Gestión de instituciones, administradores y wallets | Frontend Admin | Cuenta institucional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("D-LIST-001 / D-PERM-002 / D-COMPAT-002 | muestra una sola wallet activa del usuario autenticado y saldo del resumen real", async () => {
    const fetchMock = setupFetch();

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect((await screen.findAllByText(activeWalletDisplay)).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Cuenta institucional" })).toBeInTheDocument();
    expect(screen.getByText("Asociada")).toBeInTheDocument();
    expect(await screen.findByText("100 TVD")).toBeInTheDocument();
    expect(screen.getByText("80 TVD")).toBeInTheDocument();
    expect(screen.getByText("20 TVD")).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: /Añadir cuenta/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Cuenta administrativa")).not.toBeInTheDocument();
    expect(screen.queryByText("Cuenta operativa")).not.toBeInTheDocument();
    expect(screen.queryByText("Cuenta auxiliar")).not.toBeInTheDocument();
    expect(screen.queryByText(secondWalletDisplay)).not.toBeInTheDocument();
    expect(screen.queryByText("180 TVD")).not.toBeInTheDocument();
    expect(screen.queryByText("Cambiar correo")).not.toBeInTheDocument();
    expect(screen.queryByText("Correo actual")).not.toBeInTheDocument();
    expect(screen.queryByText("Actualizar cuenta")).not.toBeInTheDocument();
    expect(screen.queryByText(/wallet institucional/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/seed phrase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/clave privada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DNI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/discoverableHash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IDENTITY_API_KEY/i)).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(4);
    for (const [request] of fetchMock.mock.calls) {
      if (request instanceof Request) {
        expect(request.headers.get("authorization")).toBe("Bearer tenant-token");
        expect(request.headers.get("x-api-key")).toBeNull();
      }
    }
  });

  it("D-TRF-001 / D-TRF-006 / D-TRF-011 | principal inicia transferencia y queda pendiente de firma", async () => {
    const user = userEvent.setup();
    const fetchMock = setupFetch((request) => {
      const url = new URL(request.url);
      const adminsMatch = url.pathname.match(/^\/api\/v1\/institutional-tenants\/([^/]+)\/admins$/);
      if (adminsMatch) {
        return jsonResponse({
          tenantId: "tenant-1",
          data: [
            ...adminsResponse.data,
            {
              assignmentId: "assignment-2",
              tenantId: "tenant-1",
              userId: "user-2",
              name: "Admin B",
              email: "admin-b@tenant.test",
              accountAddress: secondWallet,
              institutionalRole: "SECONDARY",
              status: "APPROVED",
              active: true,
              hasWallet: true,
              walletStatus: "VERIFIED",
            },
          ],
          total: 2,
        });
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click(await screen.findByRole("button", { name: /Transferir rol principal/i }));
    const dialog = screen.getByRole("dialog", { name: "Transferir rol principal" });
    expect(within(dialog).getByText("Colegio Médico")).toBeInTheDocument();
    expect(within(dialog).getByText("Admin A")).toBeInTheDocument();
    expect(within(dialog).getByText("Admin B")).toBeInTheDocument();
    expect(within(dialog).getByText(secondWallet)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/wallet/i)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /Confirmar transferencia/i }));

    await waitFor(() => {
      const transferRequest = fetchMock.mock.calls
        .map(([request]) => request)
        .find(
          (request) =>
            request instanceof Request &&
            new URL(request.url).pathname ===
              "/api/v1/institutional-tenants/tenant-1/primary/transfer",
        );
      expect(transferRequest).toBeInstanceOf(Request);
    });
    const transferRequest = fetchMock.mock.calls
      .map(([request]) => request)
      .find(
        (request) =>
          request instanceof Request &&
          new URL(request.url).pathname ===
            "/api/v1/institutional-tenants/tenant-1/primary/transfer",
      ) as Request;
    expect(await transferRequest.json()).toEqual({
      assignmentId: "assignment-2",
      reason: "Transferencia iniciada desde Cuenta institucional",
    });
    expect(await screen.findByText("Transferencia pendiente de firma en tu teléfono.")).toBeInTheDocument();
    expect(screen.getByText("Administrador principal")).toBeInTheDocument();
  });

  it("D-RETRY-002 / D-STATE-004 | permite copiar y reintentar saldo cuando falla la consulta", async () => {
    const user = userEvent.setup();
    const fetchMock = setupFetch(() =>
      jsonResponse({
        ...summaryResponse,
        totalBalance: null,
        liquidBalance: null,
        assignedBalance: null,
      }),
    );

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(await screen.findByText("No pudimos consultar tu saldo en este momento.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actualizar saldo/i }));
    expect(fetchMock).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(screen.getByText("Dirección copiada.")).toBeInTheDocument();
  });

  it("D-REG-004 / D-REG-005 / D-COMPAT-003 | muestra regularizacion heredada y delega validacion por DNI al backend", async () => {
    const user = userEvent.setup();
    setupFetch((request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname.endsWith("/resolve-by-dni")) {
        return jsonResponse({
          registered: false,
          accountAddress: null,
          reason: "WALLET_NOT_FOUND",
          message: "No se encontró una billetera registrada para este carnet.",
        });
      }
      if (pathname.endsWith("/wallet-regularization")) {
        return jsonResponse({ message: "wallet-not-found" }, 400);
      }
      if (pathname === "/api/v1/tvd/me/summary") {
        return jsonResponse({ code: "TVD_WALLET_NOT_VERIFIED" }, 400);
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click(await screen.findByRole("button", { name: /Asociar mi cuenta/i }));
    expect(
      screen.getByRole("dialog", { name: "Asociar mi cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/wallet registrada para tu usuario/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Wallet candidata")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Carnet de identidad")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Carnet de identidad"), "12345678");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Buscar y asociar" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "Buscar y asociar" }));
    expect(
      await screen.findByText(
        "Los datos ingresados no corresponden a una cuenta válida.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar y asociar" })).not.toBeDisabled();
  });

  it("D-REG-006 / D-REG-007 / D-REG-008 | regulariza con endpoint real, no envia campos autoritativos y refresca resumen", async () => {
    const user = userEvent.setup();
    const regularizedSummary = {
      ...summaryResponse,
      wallet: secondWallet,
      assignmentId: "assignment-2",
    };
    const fetchMock = setupFetch((request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/api/v1/tvd/me/summary") {
        const regularizationCalls = fetchMock.mock.calls.filter(([called]) => {
          return (
            called instanceof Request &&
            new URL(called.url).pathname.endsWith("/wallet-regularization")
          );
        });
        return regularizationCalls.length ? jsonResponse(regularizedSummary) : jsonResponse({ code: "TVD_WALLET_NOT_VERIFIED" }, 400);
      }
      if (pathname.endsWith("/wallet-regularization")) {
        return jsonResponse({
          tenantId: "tenant-1",
          assignmentId: "assignment-2",
          userId: "user-1",
          accountAddress: secondWallet,
          institutionalRole: "PRIMARY",
          status: "APPROVED",
          active: true,
          hasWallet: true,
          requiresWalletUpdate: false,
          walletStatus: "VERIFIED",
          walletVerifiedAt: "2026-07-21T12:00:00.000Z",
          walletVerificationSource: "LEGACY_REGULARIZATION",
          updated: true,
        });
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click(await screen.findByRole("button", { name: /Asociar mi cuenta/i }));
    await user.type(screen.getByLabelText("Carnet de identidad"), "12345678");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Buscar y asociar" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "Buscar y asociar" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([request]) =>
            request instanceof Request &&
            new URL(request.url).pathname.endsWith("/wallet-regularization"),
        ),
      ).toBe(true);
    });

    expect(
      fetchMock.mock.calls.some(
        ([request]) =>
          request instanceof Request &&
          new URL(request.url).pathname.endsWith("/resolve-by-dni"),
      ),
    ).toBe(false);

    const mutationRequest = fetchMock.mock.calls
      .map(([request]) => request)
      .find(
        (request) =>
          request instanceof Request &&
          new URL(request.url).pathname.endsWith("/wallet-regularization"),
      );
    expect(mutationRequest).toBeInstanceOf(Request);
    if (mutationRequest instanceof Request) {
      const url = new URL(mutationRequest.url);
      expect(url.pathname).toBe(
        "/api/v1/institutional-tenants/tenant-1/admins/me/wallet-regularization",
      );
      const body = JSON.parse(await mutationRequest.clone().text()) as Record<string, unknown>;
      expect(body).toEqual({ dni: "12345678" });
      expect(body.accountAddress).toBeUndefined();
      expect(body.userId).toBeUndefined();
      expect(body.assignmentId).toBeUndefined();
      expect(body.availableBalance).toBeUndefined();
      expect(mutationRequest.headers.get("x-api-key")).toBeNull();
    }

    expect(
      await screen.findByText("Cuenta asociada correctamente."),
    ).toBeInTheDocument();
    expect(await screen.findByText(secondWalletDisplay)).toBeInTheDocument();
  });

  it("D-REG-009 / D-REG-010 | mapea conflictos y no permite reemplazar una wallet ya verificada desde la pantalla", async () => {
    const user = userEvent.setup();
    setupFetch((request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname.endsWith("/wallet-regularization")) {
        return jsonResponse({ message: "conflict" }, 409);
      }
      if (pathname === "/api/v1/tvd/me/summary") {
        return jsonResponse({ code: "TVD_WALLET_NOT_VERIFIED" }, 400);
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click(await screen.findByRole("button", { name: /Asociar mi cuenta/i }));
    await user.type(screen.getByLabelText("Carnet de identidad"), "12345678");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Buscar y asociar" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "Buscar y asociar" }));

    expect(
      await screen.findByText("La cuenta ya se encuentra asociada a otra institución."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cambiar wallet/i })).not.toBeInTheDocument();
  });

  it("D-INV-001 / D-INV-002 / D-INV-012 | agrega cuenta por CI validado y deja invitacion Pendiente", async () => {
    const user = userEvent.setup();
    const invitations: Array<Record<string, unknown>> = [];
    const fetchMock = setupFetch(async (request) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/resolve-by-dni")) {
        return jsonResponse({ registered: true, accountAddress: secondWallet });
      }
      if (
        url.pathname ===
          "/api/v1/institutional-admin-applications/tenants/tenant-1/invitations" &&
        request.method === "POST"
      ) {
        const body = JSON.parse(await request.clone().text());
        invitations.push({
          id: "inv-1",
          tenantId: "tenant-1",
          dni: body.dni,
          name: "Cuenta existente",
          status: "PENDING",
          expiresAt: "2026-08-04T12:00:00.000Z",
          noticeCount: 1,
        });
        return jsonResponse(invitations[0], 201);
      }
      if (
        url.pathname ===
        "/api/v1/institutional-admin-applications/tenants/tenant-1/invitations"
      ) {
        return jsonResponse({ tenantId: "tenant-1", data: invitations, total: invitations.length });
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click((await screen.findAllByRole("button", { name: /Añadir cuenta/i }))[0]);
    const dialog = screen.getByRole("dialog", { name: "Añadir cuenta" });
    expect(within(dialog).getByLabelText("CI/DNI")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Dirección/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Correo/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Contraseña/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Billetera registrada/i)).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("CI/DNI"), "12345678");
    expect(await within(dialog).findByText("Cuenta encontrada. Puedes continuar.")).toBeInTheDocument();
    expect(within(dialog).queryByDisplayValue(secondWallet)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Añadir cuenta" }));

    expect(await screen.findByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Cuenta existente")).toBeInTheDocument();
    const createRequest = fetchMock.mock.calls
      .map(([request]) => request)
      .find(
        (request) =>
          request instanceof Request &&
          request.method === "POST" &&
          new URL(request.url).pathname.endsWith("/tenant-1/invitations"),
      );
    expect(createRequest).toBeInstanceOf(Request);
    if (createRequest instanceof Request) {
      const body = JSON.parse(await createRequest.clone().text());
      expect(body).toEqual({ dni: "12345678" });
      expect(body.accountAddress).toBeUndefined();
      expect(body.email).toBeUndefined();
      expect(body.password).toBeUndefined();
    }
  });

  it("D-INV-003 / D-INV-004 / D-INV-005 | bloquea persona inexistente, ya administradora e invitacion vigente", async () => {
    const user = userEvent.setup();
    setupFetch(async (request) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/resolve-by-dni")) {
        const body = JSON.parse(await request.clone().text());
        if (body.dni === "0000000") {
          return jsonResponse(
            { message: "La persona debe registrarse primero en Tu Voto Decide." },
            400,
          );
        }
        return jsonResponse({ registered: true, accountAddress: secondWallet });
      }
      if (url.pathname.endsWith("/tenant-1/invitations") && request.method === "POST") {
        const body = JSON.parse(await request.clone().text());
        if (body.dni === "2222222") {
          return jsonResponse({ message: "Esta persona ya administra la institución." }, 409);
        }
        return jsonResponse(
          { message: "Ya existe una invitación pendiente para esta persona." },
          409,
        );
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click((await screen.findAllByRole("button", { name: /Añadir cuenta/i }))[0]);
    let dialog = screen.getByRole("dialog", { name: "Añadir cuenta" });
    await user.type(within(dialog).getByLabelText("CI/DNI"), "0000000");
    expect(
      await within(dialog).findByText(PERSON_NOT_REGISTERED_MESSAGE),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Añadir cuenta" })).toBeDisabled();

    await user.clear(within(dialog).getByLabelText("CI/DNI"));
    await user.type(within(dialog).getByLabelText("CI/DNI"), "2222222");
    expect(await within(dialog).findByText("Cuenta encontrada. Puedes continuar.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Añadir cuenta" }));
    expect(await within(dialog).findByText(ALREADY_ADMIN_MESSAGE)).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("CI/DNI"));
    await user.type(within(dialog).getByLabelText("CI/DNI"), "3333333");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Añadir cuenta" })).not.toBeDisabled(),
    );
    await user.click(within(dialog).getByRole("button", { name: "Añadir cuenta" }));
    expect(await within(dialog).findByText(DUPLICATE_INVITATION_MESSAGE)).toBeInTheDocument();
  });

  it("D-INV-006 / D-INV-007 / D-INV-008 / D-INV-009 / D-INV-010 / D-INV-011 | muestra estados de invitaciones, reenvia y cancela sin borrar historial", async () => {
    const user = userEvent.setup();
    const invitations = [
      {
        id: "inv-pending",
        tenantId: "tenant-1",
        dni: "7777777",
        name: "Invitación Operativa",
        status: "PENDING",
        expiresAt: "2026-08-04T12:00:00.000Z",
        noticeCount: 1,
      },
      {
        id: "inv-accepted",
        tenantId: "tenant-1",
        dni: "7777778",
        name: "Invitación Aceptada",
        status: "ACCEPTED",
        expiresAt: "2026-08-04T12:00:00.000Z",
      },
      {
        id: "inv-rejected",
        tenantId: "tenant-1",
        dni: "7777779",
        name: "Invitación Rechazada",
        status: "REJECTED",
        expiresAt: "2026-08-04T12:00:00.000Z",
      },
      {
        id: "inv-expired",
        tenantId: "tenant-1",
        dni: "7777780",
        name: "Invitación Vencida",
        status: "EXPIRED",
        expiresAt: "2026-07-20T12:00:00.000Z",
      },
    ];
    setupFetch((request) => {
      const url = new URL(request.url);
      if (
        url.pathname ===
        "/api/v1/institutional-admin-applications/tenants/tenant-1/invitations"
      ) {
        return jsonResponse({ tenantId: "tenant-1", data: invitations, total: invitations.length });
      }
      if (url.pathname.endsWith("/invitations/inv-pending/resend")) {
        invitations[0].noticeCount = 2;
        return jsonResponse(invitations[0]);
      }
      if (url.pathname.endsWith("/invitations/inv-pending/cancel")) {
        invitations[0].status = "CANCELLED";
        return jsonResponse({ ...invitations[0], cancelledAt: "2026-07-28T12:00:00.000Z" });
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(await screen.findByText("Invitación Operativa")).toBeInTheDocument();
    expect(screen.getByText("Invitación Aceptada")).toBeInTheDocument();
    expect(screen.getByText("Invitación Rechazada")).toBeInTheDocument();
    expect(screen.getByText("Invitación Vencida")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Aceptada")).toBeInTheDocument();
    expect(screen.getByText("Rechazada")).toBeInTheDocument();
    expect(screen.getByText("Vencida")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reenviar" }));
    expect(
      await screen.findByText("Aviso reenviado sin crear otra invitación."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Invitación Operativa")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("Invitación Operativa")).toBeInTheDocument();
  });

  it("D-REQ-002 / D-REQ-003 / D-REQ-005 / D-APR-001 / D-APR-002 / D-APR-003 / D-APR-004 / D-APR-006 | muestra solicitudes, aprueba pendiente de firma y rechaza sin acceso", async () => {
    const user = userEvent.setup();
    const applications = [
      {
        id: "app-approve",
        tenantId: "tenant-1",
        name: "Solicitante A",
        email: "solicitante-a@example.com",
        institutionName: "Colegio Médico",
        status: "PENDING_APPROVAL",
      },
      {
        id: "app-reject",
        tenantId: "tenant-1",
        name: "Solicitante B",
        email: "solicitante-b@example.com",
        institutionName: "Colegio Médico",
        status: "PENDING_APPROVAL",
      },
    ];
    let approveCalls = 0;
    setupFetch((request) => {
      const url = new URL(request.url);
      if (url.pathname === "/api/v1/institutional-admin-applications") {
        return jsonResponse({ data: applications, total: applications.length });
      }
      if (url.pathname.endsWith("/app-approve/approve")) {
        approveCalls += 1;
        applications[0].status = "PENDING_MOBILE_AUTHORIZATION";
        return jsonResponse({ id: "app-approve", status: "PENDING_MOBILE_AUTHORIZATION" }, 201);
      }
      if (url.pathname.endsWith("/app-reject/reject")) {
        applications[1].status = "REJECTED";
        return jsonResponse({ id: "app-reject", status: "REJECTED" }, 201);
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(await screen.findByText("Solicitante A")).toBeInTheDocument();
    expect(screen.getByText("Solicitante B")).toBeInTheDocument();
    await user.dblClick(screen.getAllByRole("button", { name: "Aprobar" })[0]);
    await waitFor(() => expect(approveCalls).toBe(1));
    expect(await screen.findByText("Pendiente de firma en tu teléfono")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de firma en tu teléfono")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(await screen.findByText("Rechazada")).toBeInTheDocument();
    expect(screen.getByText("Solicitud rechazada. No se creó firma pendiente.")).toBeInTheDocument();
  });

  it("D-LIST-001 / D-LIST-003 / D-LIST-004 / D-DIS-001 / D-DIS-004 / D-DIS-005 / D-DIS-006 / D-DIS-007 | principal ve estados y suspende o reactiva sin firma", async () => {
    const user = userEvent.setup();
    const adminRows = [
      {
        ...adminsResponse.data[0],
        assignmentId: "primary-assignment",
        userId: "user-1",
        name: "Admin principal",
        institutionalRole: "PRIMARY",
        status: "APPROVED",
        active: true,
      },
      {
        ...adminsResponse.data[0],
        assignmentId: "secondary-active",
        userId: "user-2",
        name: "Admin activa",
        institutionalRole: "SECONDARY",
        status: "APPROVED",
        active: true,
      },
      {
        ...adminsResponse.data[0],
        assignmentId: "secondary-suspended",
        userId: "user-3",
        name: "Admin suspendida",
        institutionalRole: "SECONDARY",
        status: "SUSPENDED",
        active: false,
      },
      {
        ...adminsResponse.data[0],
        assignmentId: "secondary-pending",
        userId: "user-4",
        name: "Admin pendiente",
        institutionalRole: "SECONDARY",
        status: "PENDING",
        active: false,
      },
    ];
    const statusCalls: Array<{ url: string; body: any }> = [];
    setupFetch(async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/api/v1/institutional-tenants/tenant-1/admins") {
        if (request.method === "PATCH") {
          const body = await request.json();
          statusCalls.push({ url: url.pathname, body });
          const assignmentId = url.pathname.split("/")[6];
          const row = adminRows.find((admin) => admin.assignmentId === assignmentId);
          if (!row) return jsonResponse({ message: "No encontrado" }, 404);
          row.active = body.active;
          row.status = body.active ? "APPROVED" : "SUSPENDED";
          return jsonResponse(row);
        }
        return jsonResponse({ tenantId: "tenant-1", data: adminRows, total: adminRows.length });
      }
      const statusPrefix = "/api/v1/institutional-tenants/tenant-1/admins/";
      const statusSuffix = "/status";
      const statusAssignmentId =
        url.pathname.startsWith(statusPrefix) && url.pathname.endsWith(statusSuffix)
          ? url.pathname.slice(statusPrefix.length, -statusSuffix.length)
          : null;
      if (statusAssignmentId) {
        const body = await request.json();
        statusCalls.push({ url: url.pathname, body });
        const row = adminRows.find((admin) => admin.assignmentId === statusAssignmentId);
        if (!row) return jsonResponse({ message: "No encontrado" }, 404);
        row.active = body.active;
        row.status = body.active ? "APPROVED" : "SUSPENDED";
        return jsonResponse(row);
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(await screen.findByText("Admin principal")).toBeInTheDocument();
    expect(screen.getByText("Admin activa")).toBeInTheDocument();
    expect(screen.getByText("Admin suspendida")).toBeInTheDocument();
    expect(screen.getByText("Admin pendiente")).toBeInTheDocument();
    expect(screen.getAllByText("Acceso habilitado").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Acceso suspendido")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();

    const primaryCard = screen.getByText("Admin principal").closest("article");
    expect(primaryCard).not.toBeNull();
    expect(within(primaryCard as HTMLElement).queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();

    const activeCard = screen.getByText("Admin activa").closest("article");
    expect(activeCard).not.toBeNull();
    await user.click(within(activeCard as HTMLElement).getByRole("button", { name: "Suspender" }));
    await waitFor(() => expect(statusCalls.some((call) => call.url.includes("secondary-active/status") && call.body.active === false)).toBe(true));
    expect(await screen.findByText("Acceso suspendido. La wallet permanece autorizada.")).toBeInTheDocument();

    const suspendedCard = screen.getByText("Admin suspendida").closest("article");
    expect(suspendedCard).not.toBeNull();
    await user.click(within(suspendedCard as HTMLElement).getByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(statusCalls.some((call) => call.url.includes("secondary-suspended/status") && call.body.active === true)).toBe(true));
    expect(await screen.findByText("Acceso habilitado. No se pidió firma ni operación en la red.")).toBeInTheDocument();
  });

  it("D-REQ-006 / D-REQ-007 / D-PERM-003 | un administrador secundario ve la cuenta pero no acciones exclusivas", async () => {
    const secondaryAdminsResponse = {
      ...adminsResponse,
      data: [
        {
          ...adminsResponse.data[0],
          institutionalRole: "SECONDARY",
          userId: "user-1",
        },
      ],
    };
    setupFetch((request) => {
      const url = new URL(request.url);
      if (url.pathname === "/api/v1/institutional-tenants/tenant-1/admins") {
        return jsonResponse(secondaryAdminsResponse);
      }
      if (
        url.pathname ===
        "/api/v1/institutional-admin-applications/tenants/tenant-1/invitations"
      ) {
        return jsonResponse({
          tenantId: "tenant-1",
          data: [
            {
              id: "inv-secondary",
              tenantId: "tenant-1",
              dni: "8888888",
              name: "Pendiente sin acciones",
              status: "PENDING",
              expiresAt: "2026-08-04T12:00:00.000Z",
            },
          ],
          total: 1,
        });
      }
      if (url.pathname === "/api/v1/institutional-admin-applications") {
        return jsonResponse({
          data: [
            {
              id: "app-secondary",
              tenantId: "tenant-1",
              name: "Solicitud sin acciones",
              status: "PENDING_APPROVAL",
            },
          ],
          total: 1,
        });
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(await screen.findByText("Pendiente sin acciones")).toBeInTheDocument();
    expect(screen.getByText("Solicitud sin acciones")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Añadir cuenta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reenviar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactivar" })).not.toBeInTheDocument();
  });

  it("D-SIGN-009 / D-SIGN-010 / D-SIGN-011 / D-SIGN-014 | refleja estados moviles sin habilitar acceso antes de confirmacion", async () => {
    setupFetch((request) => {
      const url = new URL(request.url);
      if (url.pathname === "/api/v1/institutional-admin-applications") {
        return jsonResponse({
          data: [
            {
              id: "app-processing",
              tenantId: "tenant-1",
              name: "Solicitante procesando",
              email: "procesando@example.com",
              status: "PENDING_CHAIN_CONFIRMATION",
            },
            {
              id: "app-retry",
              tenantId: "tenant-1",
              name: "Solicitante reintento",
              email: "reintento@example.com",
              status: "CHAIN_RETRY_PENDING",
            },
            {
              id: "app-expired",
              tenantId: "tenant-1",
              name: "Solicitante vencida",
              email: "vencida@example.com",
              status: "MOBILE_AUTHORIZATION_EXPIRED",
            },
            {
              id: "app-approved",
              tenantId: "tenant-1",
              name: "Solicitante activa",
              email: "activa@example.com",
              status: "APPROVED",
            },
          ],
          total: 4,
        });
      }
      return undefined;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(await screen.findByText("Solicitante procesando")).toBeInTheDocument();
    expect(screen.getByText("Procesando autorización")).toBeInTheDocument();
    expect(screen.getByText("Solicitante reintento")).toBeInTheDocument();
    expect(screen.getByText("Error recuperable")).toBeInTheDocument();
    expect(screen.getByText("Solicitante vencida")).toBeInTheDocument();
    expect(screen.getByText("Vencida")).toBeInTheDocument();
    expect(screen.getByText("Solicitante activa")).toBeInTheDocument();
    expect(screen.getAllByText("Acceso habilitado").length).toBeGreaterThanOrEqual(1);
  });

  it("D-MULTI-001 / D-COMPAT-004 | no muestra datos del tenant anterior al cambiar de contexto", async () => {
    const tenantBWallet = "0x4444444444444444444444444444444444444444";
    setupFetch((request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname !== "/api/v1/tvd/me/summary") return undefined;
      const authorization = request.headers.get("authorization");
      if (authorization === "Bearer tenant-b-token") {
        return jsonResponse({
          ...summaryResponse,
          tenantId: "tenant-2",
          assignmentId: "assignment-b",
          wallet: tenantBWallet,
        });
      }
      return jsonResponse(summaryResponse);
    });

    const first = renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());
    expect((await screen.findAllByText(activeWalletDisplay)).length).toBeGreaterThan(0);
    first.unmount();

    renderWithAuthStore(
      <InstitutionalAccountPage />,
      tenantAuth({
        token: "tenant-b-token",
        accessToken: "tenant-b-token",
        tenantId: "tenant-2",
        activeContext: {
          type: "TENANT",
          role: "TENANT_ADMIN",
          tenantId: "tenant-2",
          tenantName: "Universidad Mayor",
        },
        user: {
          id: "user-2",
          email: "admin-b@tenant.test",
          name: "Admin B",
          role: "TENANT_ADMIN",
          active: true,
          status: "ACTIVE",
          tenantId: "tenant-2",
          tenantName: "Universidad Mayor",
        },
      }),
    );

    expect(await screen.findByText("0x444444...444444")).toBeInTheDocument();
    expect(screen.queryByText(activeWalletDisplay)).not.toBeInTheDocument();
    expect(screen.queryByText("180 TVD")).not.toBeInTheDocument();
  });
});
