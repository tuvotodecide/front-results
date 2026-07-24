import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import TvdManualAssignmentPage from "@/domains/superadmin/screens/TvdManualAssignmentPage";
import type {
  TvdAdminInstitutionListResponse,
  TvdAdminInstitutionWalletsResponse,
  TvdManualAssignmentResponse,
} from "@/store/tvd";
import { renderWithAuthStore } from "../utils/renderWithStore";

const institutionsResponse: TvdAdminInstitutionListResponse = {
  items: [
    {
      tenantId: "tenant-1",
      name: "Tribunal Supremo Electoral",
      active: true,
      assignmentsCount: 2,
      eligibleWalletsCount: 2,
    },
    {
      tenantId: "tenant-disabled",
      name: "Institución deshabilitada",
      active: false,
      assignmentsCount: 1,
      eligibleWalletsCount: 0,
    },
  ],
  page: 1,
  limit: 20,
  total: 2,
  hasNextPage: false,
};

const walletsResponse: TvdAdminInstitutionWalletsResponse = {
  tenantId: "tenant-1",
  tenantName: "Tribunal Supremo Electoral",
  tenantActive: true,
  wallets: [
    {
      assignmentId: "assignment-a",
      userId: "user-a",
      institutionalRole: "TENANT_ADMIN",
      status: "APPROVED",
      active: true,
      userActive: true,
      wallet: "0x1111111111111111111111111111111111111111",
      walletNormalized: "0x1111111111111111111111111111111111111111",
      walletStatus: "VERIFIED",
      walletVerifiedAt: "2026-07-22T10:00:00.000Z",
      walletVerificationSource: "IDENTITY",
      eligible: true,
    },
    {
      assignmentId: "assignment-b",
      userId: "user-b",
      institutionalRole: "FINANCE_ADMIN",
      status: "APPROVED",
      active: true,
      userActive: true,
      wallet: "0x2222222222222222222222222222222222222222",
      walletNormalized: "0x2222222222222222222222222222222222222222",
      walletStatus: "VERIFIED",
      walletVerifiedAt: "2026-07-22T10:00:00.000Z",
      walletVerificationSource: "IDENTITY",
      eligible: true,
    },
    {
      assignmentId: "assignment-disabled",
      userId: "user-c",
      institutionalRole: "TENANT_ADMIN",
      status: "PENDING",
      active: true,
      userActive: true,
      wallet: "0x3333333333333333333333333333333333333333",
      walletNormalized: "0x3333333333333333333333333333333333333333",
      walletStatus: "PENDING",
      walletVerifiedAt: null,
      walletVerificationSource: null,
      eligible: false,
    },
  ],
};

const pendingAssignment: TvdManualAssignmentResponse = {
  id: "accreditation-1",
  sourceType: "MANUAL_GRANT",
  tenantId: "tenant-1",
  targetAssignmentId: "assignment-b",
  targetWallet: "0x2222222222222222222222222222222222222222",
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
  ...pendingAssignment,
  status: "CONFIRMED",
  txHash: "0xmanualassignmenthash",
  chainId: 84532,
  contractAddress: "0x4444444444444444444444444444444444444444",
  blockNumber: "12345",
  confirmedAt: "2026-07-22T10:02:00.000Z",
};

type CapturedRequest = {
  method: string;
  pathname: string;
  headers: Headers;
  body: unknown;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const createFetchMock = (captured: CapturedRequest[] = []) =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const body =
      request.method === "POST" ? await request.clone().json() : null;
    captured.push({
      method: request.method,
      pathname: url.pathname,
      headers: request.headers,
      body,
    });

    if (url.pathname === "/api/v1/tvd/admin/institutions") {
      return jsonResponse(institutionsResponse);
    }
    if (url.pathname === "/api/v1/tvd/admin/institutions/tenant-1/wallets") {
      return jsonResponse(walletsResponse);
    }
    if (url.pathname === "/api/v1/tvd/manual-assignments" && request.method === "POST") {
      return jsonResponse(pendingAssignment);
    }
    if (url.pathname === "/api/v1/tvd/manual-assignments/accreditation-1") {
      return jsonResponse(confirmedAssignment);
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });

const renderAssignmentPage = () =>
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

describe("Superadmin TVD manual assignment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lista instituciones y wallets reales, crea con Idempotency-Key y sigue el detalle", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    const fetchMock = createFetchMock(captured);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", {
      randomUUID: () => "idem-manual-1",
      getRandomValues: (bytes: Uint8Array) => bytes,
    });

    renderAssignmentPage();

    expect(await screen.findByText("Tribunal Supremo Electoral")).toBeInTheDocument();
    expect(screen.getByText(/2 wallet\(s\) disponible\(s\)/i)).toBeInTheDocument();
    await user.click(screen.getByText("Tribunal Supremo Electoral"));

    expect(await screen.findByText("FINANCE_ADMIN")).toBeInTheDocument();
    expect(screen.getByText("0x1111111111111111111111111111111111111111")).toBeInTheDocument();
    expect(screen.getByText("0x2222222222222222222222222222222222222222")).toBeInTheDocument();
    await user.click(screen.getByText("FINANCE_ADMIN"));
    await user.type(screen.getByLabelText(/Cantidad TVD/i), "25.5000");
    await user.type(
      screen.getByLabelText(/Motivo auditado/i),
      "Asignación operativa piloto",
    );
    await user.click(screen.getByRole("button", { name: /Revisar operación/i }));
    await user.dblClick(screen.getByRole("button", { name: /Solicitar asignación/i }));

    expect(await screen.findByText("Asignación TVD confirmada.")).toBeInTheDocument();
    expect(screen.getByText("0xmanualassignmenthash")).toBeInTheDocument();
    expect(screen.queryByText(/MetaMask/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Wallet origen/i)).not.toBeInTheDocument();

    const postCalls = captured.filter(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/v1/tvd/manual-assignments",
    );
    expect(postCalls).toHaveLength(1);
    expect(postCalls[0].headers.get("authorization")).toBe("Bearer superadmin-token");
    expect(postCalls[0].headers.get("idempotency-key")).toBe("idem-manual-1");
    expect(postCalls[0].headers.get("x-api-key")).toBeNull();
    expect(postCalls[0].body).toEqual({
      tenantId: "tenant-1",
      assignmentId: "assignment-b",
      tokenAmount: "25.5",
      reason: "Asignación operativa piloto",
    });
    expect(JSON.stringify(postCalls[0].body)).not.toContain("wallet");
    expect(JSON.stringify(postCalls[0].body)).not.toContain("txHash");

    expect(
      captured.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/v1/tvd/manual-assignments/accreditation-1",
      ),
    ).toBe(true);
  });

  it("bloquea datos inválidos, wallets no elegibles y no envía wallet manual", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", createFetchMock(captured));

    renderAssignmentPage();

    await user.click(await screen.findByText("Tribunal Supremo Electoral"));
    await user.click(await screen.findByText("0x3333333333333333333333333333333333333333"));
    expect(
      screen.getByText("Selecciona una wallet verificada y habilitada."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Revisar operación/i }));
    expect(screen.getByText("Selecciona una wallet institucional.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa una cantidad TVD mayor a 0.")).toBeInTheDocument();

    await user.click(screen.getByText("FINANCE_ADMIN"));
    await user.type(screen.getByLabelText(/Cantidad TVD/i), "1e3");
    await user.type(screen.getByLabelText(/Motivo auditado/i), "corto");
    await user.click(screen.getByRole("button", { name: /Revisar operación/i }));
    expect(screen.getByText("Ingresa una cantidad TVD mayor a 0.")).toBeInTheDocument();
    expect(
      screen.getByText("Describe un motivo de entre 8 y 240 caracteres."),
    ).toBeInTheDocument();
    expect(
      captured.some((request) => request.pathname === "/api/v1/tvd/manual-assignments"),
    ).toBe(false);
  });

  it("muestra errores seguros y permite reintentar listas", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ code: "SERVER_ERROR" }, 500))
      .mockResolvedValueOnce(jsonResponse(institutionsResponse));
    vi.stubGlobal("fetch", fetchMock);

    renderAssignmentPage();

    expect(await screen.findByText(/No pudimos cargar las instituciones/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect(await screen.findByText("Tribunal Supremo Electoral")).toBeInTheDocument();
  });

  it("maneja NEEDS_REVIEW devuelto por backend sin inventar txHash", async () => {
    const user = userEvent.setup();
    const needsReview: TvdManualAssignmentResponse = {
      ...pendingAssignment,
      status: "NEEDS_REVIEW",
      txHash: null,
      lastErrorCode: "TVD_RECEIPT_NOT_FOUND",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);
      if (url.pathname === "/api/v1/tvd/admin/institutions") {
        return jsonResponse(institutionsResponse);
      }
      if (url.pathname === "/api/v1/tvd/admin/institutions/tenant-1/wallets") {
        return jsonResponse(walletsResponse);
      }
      if (url.pathname === "/api/v1/tvd/manual-assignments") {
        return jsonResponse(
          {
            code: "TVD_MANUAL_ASSIGNMENT_NEEDS_REVIEW",
            accreditation: needsReview,
          },
          503,
        );
      }
      if (url.pathname === "/api/v1/tvd/manual-assignments/accreditation-1") {
        return jsonResponse(needsReview);
      }
      return jsonResponse({ code: "NOT_FOUND" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", {
      randomUUID: () => "idem-needs-review",
      getRandomValues: (bytes: Uint8Array) => bytes,
    });

    renderAssignmentPage();
    await user.click(await screen.findByText("Tribunal Supremo Electoral"));
    await user.click(await screen.findByText("FINANCE_ADMIN"));
    await user.type(screen.getByLabelText(/Cantidad TVD/i), "10");
    await user.type(
      screen.getByLabelText(/Motivo auditado/i),
      "Asignación operativa piloto",
    );
    await user.click(screen.getByRole("button", { name: /Revisar operación/i }));
    await user.click(screen.getByRole("button", { name: /Solicitar asignación/i }));

    expect(await screen.findAllByText("La asignación requiere revisión manual.")).toHaveLength(2);
    expect(screen.getByText("Sin txHash aún")).toBeInTheDocument();
    expect(screen.queryByText(/0xreserve/i)).not.toBeInTheDocument();
  });
});
