import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TvdManualAssignmentPage from "@/domains/superadmin/screens/TvdManualAssignmentPage";
import TvdOperationsPage from "@/domains/superadmin/screens/TvdOperationsPage";
import type {
  TvdAdminInstitutionListResponse,
  TvdAdminInstitutionWalletsResponse,
  TvdAdminOperation,
  TvdAdminOperationsResponse,
  TvdManualAssignmentResponse,
} from "@/store/tvd";
import { renderWithAuthStore } from "../utils/renderWithStore";

const assignmentWallet = "0x1111111111111111111111111111111111111111";

const institutions: TvdAdminInstitutionListResponse = {
  items: [
    {
      tenantId: "tenant-1",
      name: "Tribunal Supremo Electoral",
      active: true,
      assignmentsCount: 1,
      eligibleWalletsCount: 1,
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
  hasNextPage: false,
};

const wallets: TvdAdminInstitutionWalletsResponse = {
  tenantId: "tenant-1",
  tenantName: "Tribunal Supremo Electoral",
  tenantActive: true,
  wallets: [
    {
      assignmentId: "assignment-1",
      userId: "user-1",
      institutionalRole: "TENANT_ADMIN",
      status: "APPROVED",
      active: true,
      userActive: true,
      wallet: assignmentWallet,
      walletNormalized: assignmentWallet,
      walletStatus: "VERIFIED",
      walletVerifiedAt: "2026-07-22T10:00:00.000Z",
      walletVerificationSource: "IDENTITY",
      eligible: true,
    },
  ],
};

const submittedAssignment: TvdManualAssignmentResponse = {
  id: "accreditation-1",
  sourceType: "MANUAL_GRANT",
  tenantId: "tenant-1",
  targetAssignmentId: "assignment-1",
  targetWallet: assignmentWallet,
  tokenAmount: "25.5",
  tokenAmountSmallestUnit: "25500000000000000000",
  status: "SUBMITTED",
  txHash: null,
  chainId: null,
  contractAddress: null,
  blockNumber: null,
  reason: "Asignación operativa piloto",
  attempts: 1,
  failureCategory: null,
  lastErrorCode: null,
  createdAt: "2026-07-22T10:00:00.000Z",
  updatedAt: "2026-07-22T10:00:00.000Z",
  submittedAt: "2026-07-22T10:01:00.000Z",
  confirmedAt: null,
};

const confirmedAssignment: TvdManualAssignmentResponse = {
  ...submittedAssignment,
  status: "CONFIRMED",
  txHash: "0xmanualassignmenthash",
  chainId: 84532,
  contractAddress: "0x4444444444444444444444444444444444444444",
  blockNumber: "12345",
  confirmedAt: "2026-07-22T10:02:00.000Z",
};

const operation: TvdAdminOperation = {
  id: "operation-1",
  tenantId: "tenant-1",
  institutionName: "Tribunal Supremo Electoral",
  operationType: "MANUAL_ASSIGNMENT",
  operationLabel: "Asignación manual",
  economicDirection: "IN",
  status: "CONFIRMED",
  statusLabel: "Confirmada",
  amount: "25.5",
  amountSmallestUnit: "25500000000000000000",
  txHash: "0x1234567890abcdef1234567890abcdef12345678",
  date: "2026-07-22T12:00:00.000Z",
  explorerUrl: "https://sepolia.basescan.org/tx/0x1234567890abcdef1234567890abcdef12345678",
  source: "TOKEN_ACCREDITATION",
};

const operations: TvdAdminOperationsResponse = {
  items: [operation],
  page: 1,
  limit: 20,
  total: 1,
  hasNextPage: false,
  summary: { totalOperations: 1, totalAssigned: "25.5", totalConsumed: "0" },
};

type CapturedRequest = {
  method: string;
  path: string;
  headers: Headers;
  body: unknown;
};

type AssignmentResponseMode = "confirmed" | "idempotency-conflict";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const installFetch = (
  captured: CapturedRequest[],
  assignmentResponse: AssignmentResponseMode = "confirmed",
) =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const body = request.method === "POST" ? await request.clone().json() : null;
    captured.push({
      method: request.method,
      path: `${url.pathname}${url.search}`,
      headers: request.headers,
      body,
    });

    if (url.pathname === "/api/v1/tvd/admin/institutions") return jsonResponse(institutions);
    if (url.pathname === "/api/v1/tvd/admin/institutions/tenant-1/wallets") return jsonResponse(wallets);
    if (url.pathname === "/api/v1/tvd/manual-assignments" && request.method === "POST") {
      if (assignmentResponse === "idempotency-conflict") {
        return jsonResponse(
          {
            code: "TVD_IDEMPOTENCY_CONFLICT",
            message: "Los datos del intento cambiaron. Inicia una nueva asignación.",
          },
          409,
        );
      }
      return jsonResponse(submittedAssignment);
    }
    if (url.pathname === "/api/v1/tvd/manual-assignments/accreditation-1") {
      return jsonResponse(confirmedAssignment);
    }
    if (url.pathname === "/api/v1/tvd/admin/operations") return jsonResponse(operations);
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });

const renderAssignment = () =>
  renderWithAuthStore(<TvdManualAssignmentPage />, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
    availableContexts: [{ type: "GLOBAL_ADMIN", role: "SUPERADMIN" }],
    activeContext: { type: "GLOBAL_ADMIN", role: "SUPERADMIN" },
    user: {
      id: "superadmin-1",
      email: "superadmin@test.dev",
      name: "Superadmin",
      role: "SUPERADMIN",
      active: true,
    },
  });

const renderOperations = () =>
  renderWithAuthStore(<TvdOperationsPage />, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
    availableContexts: [{ type: "GLOBAL_ADMIN", role: "SUPERADMIN" }],
    activeContext: { type: "GLOBAL_ADMIN", role: "SUPERADMIN" },
    user: {
      id: "superadmin-1",
      email: "superadmin@test.dev",
      name: "Superadmin",
      role: "SUPERADMIN",
      active: true,
    },
  });

const fillAssignment = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    await screen.findByRole("button", { name: /Tribunal Supremo Electoral/i }),
  );
  await user.click(
    await screen.findByRole("button", { name: new RegExp(assignmentWallet, "i") }),
  );
  await user.type(screen.getByLabelText(/Cantidad TVD/i), "25.5000");
  await user.type(screen.getByLabelText(/^Motivo/i), "Asignación operativa piloto");
  await user.click(screen.getByRole("button", { name: /^Continuar$/i }));
};

const findConfirmedAssignmentHeading = () =>
  screen.findByRole("heading", { name: "Asignación TVD confirmada." });

describe("MX-16 | integración de asignación y operaciones TVD", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("[MX-16][ADM-ASG-P0-001][INTEGRACION] envía el wizard global con Idempotency-Key y consulta el estado de acreditación", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", installFetch(captured));
    vi.stubGlobal("crypto", {
      randomUUID: () => "idem-mx16-1",
      getRandomValues: (bytes: Uint8Array) => bytes,
    });

    renderAssignment();
    await fillAssignment(user);
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    expect(await findConfirmedAssignmentHeading()).toBeInTheDocument();
    const createRequest = captured.find(
      (request) => request.method === "POST" && request.path === "/api/v1/tvd/manual-assignments",
    );
    expect(createRequest?.headers.get("idempotency-key")).toBe("idem-mx16-1");
    expect(createRequest?.body).toEqual({
      tenantId: "tenant-1",
      assignmentId: "assignment-1",
      tokenAmount: "25.5",
      reason: "Asignación operativa piloto",
    });
    expect(
      captured.some(
        (request) => request.path === "/api/v1/tvd/manual-assignments/accreditation-1",
      ),
    ).toBe(true);
  });

  it("[MX-16][ADM-ASG-P0-001][ACEPTACION] confirma que el navegador no construye ni firma una transacción blockchain", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    const ethereum = { request: vi.fn() };
    vi.stubGlobal("fetch", installFetch(captured));
    vi.stubGlobal("crypto", {
      randomUUID: () => "idem-mx16-2",
      getRandomValues: (bytes: Uint8Array) => bytes,
    });
    vi.stubGlobal("ethereum", ethereum);

    renderAssignment();
    await fillAssignment(user);
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    expect(await findConfirmedAssignmentHeading()).toBeInTheDocument();
    expect(ethereum.request).not.toHaveBeenCalled();
    const createRequest = captured.find((request) => request.method === "POST");
    expect(createRequest?.path).toBe("/api/v1/tvd/manual-assignments");
    expect(JSON.stringify(createRequest?.body)).not.toMatch(
      /wallet|private|secret|txHash|signature/i,
    );
  });

  it("[MX-16][ADM-ASG-P0-002][INTEGRACION] conserva campos corregibles y rota idempotencia ante conflicto de payload", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", installFetch(captured, "idempotency-conflict"));
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce("idem-mx16-conflict-1")
        .mockReturnValueOnce("idem-mx16-conflict-2"),
      getRandomValues: (bytes: Uint8Array) => bytes,
    });

    renderAssignment();
    await fillAssignment(user);
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    const firstError = await screen.findByRole("alert");
    expect(
      within(firstError).getByText("Los datos del intento cambiaron. Inicia una nueva asignación."),
    ).toBeInTheDocument();
    expect(screen.getByText("25.5 TVD")).toBeInTheDocument();
    expect(screen.getByText("Asignación operativa piloto")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const amount = screen.getByLabelText(/Cantidad TVD/i);
    await user.clear(amount);
    await user.type(amount, "30");
    await user.click(screen.getByRole("button", { name: /^Continuar$/i }));
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    await waitFor(() => {
      expect(captured.filter((request) => request.method === "POST")).toHaveLength(2);
    });
    const createRequests = captured.filter((request) => request.method === "POST");
    expect(createRequests.map((request) => request.headers.get("idempotency-key"))).toEqual([
      "idem-mx16-conflict-1",
      "idem-mx16-conflict-2",
    ]);
    expect(createRequests.map((request) => request.body)).toEqual([
      {
        tenantId: "tenant-1",
        assignmentId: "assignment-1",
        tokenAmount: "25.5",
        reason: "Asignación operativa piloto",
      },
      {
        tenantId: "tenant-1",
        assignmentId: "assignment-1",
        tokenAmount: "30",
        reason: "Asignación operativa piloto",
      },
    ]);
  });

  it("[MX-16][ADM-OPS-P1-001][INTEGRACION] consulta operaciones con filtros, resumen y enlaces condicionados", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", installFetch(captured));

    renderOperations();
    expect(await screen.findAllByText("Tribunal Supremo Electoral")).not.toHaveLength(0);
    expect(screen.getAllByText("25.5 $TVD")).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: /Comprobar operación/i })).not.toHaveLength(0);

    await user.selectOptions(screen.getByLabelText("Institución"), "tenant-1");
    await user.selectOptions(screen.getByLabelText("Estado"), "CONFIRMED");
    await waitFor(() => {
      const request = captured
        .filter((item) => item.path.startsWith("/api/v1/tvd/admin/operations"))
        .at(-1);
      expect(request?.path).toMatch(/tenantId=tenant-1/);
      expect(request?.path).toMatch(/status=CONFIRMED/);
    });
  });

  it("[MX-16][ADM-CON-P0-001][INTEGRACION] muestra el resultado terminal sin reabrir el wizard ni continuar acreditando", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", installFetch(captured));
    vi.stubGlobal("crypto", {
      randomUUID: () => "idem-mx16-3",
      getRandomValues: (bytes: Uint8Array) => bytes,
    });

    renderAssignment();
    await fillAssignment(user);
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    expect(await findConfirmedAssignmentHeading()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Continuar$/i })).not.toBeInTheDocument();
    expect(
      captured.filter(
        (request) => request.path === "/api/v1/tvd/manual-assignments/accreditation-1",
      ),
    ).toHaveLength(1);
  });

  it("[MX-16][ADM-CON-P1-002][INTEGRACION] traduce el fallo recuperable de asignación a un mensaje accionable", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", installFetch(captured, "idempotency-conflict"));
    vi.stubGlobal("crypto", {
      randomUUID: () => "idem-mx16-conflict-message",
      getRandomValues: (bytes: Uint8Array) => bytes,
    });

    renderAssignment();
    await fillAssignment(user);
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    const error = await screen.findByRole("alert");
    expect(
      within(error).getByText("Los datos del intento cambiaron. Inicia una nueva asignación."),
    ).toBeInTheDocument();
    expect(captured.filter((request) => request.method === "POST")).toHaveLength(1);
  });
});
