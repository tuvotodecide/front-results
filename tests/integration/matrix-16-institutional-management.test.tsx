import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegistrosPage from "@/app/(superadmin)/superadmin/gestion/registros/page";
import InstitutionalRecoveryAdminPage from "@/domains/superadmin/screens/InstitutionalRecoveryAdminPage";
import type { InstitutionalApplication } from "@/store/accessApprovals";
import type {
  InstitutionalRecoveryDetail,
  InstitutionalRecoveryListItem,
  InstitutionalRecoveryListResponse,
} from "@/store/institutionalRecovery";
import { accessApprovalApplications } from "../fixtures/admin/accessApprovals";
import { renderWithAuthStore } from "../utils/renderWithStore";

const approvalMocks = vi.hoisted(() => ({
  applications: [] as InstitutionalApplication[],
  details: {} as Record<string, InstitutionalApplication>,
  approve: vi.fn(),
  reject: vi.fn(),
  revoke: vi.fn(),
  reopen: vi.fn(),
  retry: vi.fn(),
}));

vi.mock("@/store/accessApprovals", () => {
  const mutation = (handler: ReturnType<typeof vi.fn>) => [
    (payload: unknown) => ({ unwrap: () => handler(payload) }),
    { isLoading: false },
  ];

  return {
    useGetInstitutionalApplicationsQuery: () => ({
      data: approvalMocks.applications,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useGetInstitutionalApplicationQuery: (id: string, options?: { skip?: boolean }) => ({
      data: options?.skip ? undefined : approvalMocks.details[id],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useApproveInstitutionalApplicationMutation: () => mutation(approvalMocks.approve),
    useRejectInstitutionalApplicationMutation: () => mutation(approvalMocks.reject),
    useRevokeInstitutionalApplicationMutation: () => mutation(approvalMocks.revoke),
    useReopenInstitutionalApplicationMutation: () => mutation(approvalMocks.reopen),
    useRetryInstitutionalAuthorizationMutation: () => mutation(approvalMocks.retry),
  };
});

const pendingRequest: InstitutionalRecoveryListItem = {
  requestId: "request-1",
  tenantId: "tenant-1",
  institutionName: "Tribunal Supremo Electoral",
  fullName: "Ana Gomez",
  phoneNumber: "70000000",
  newEmail: "ana.nueva@tse.bo",
  supervisorPhoneNumber: "71111111",
  status: "PENDING",
  requestedAt: "2026-07-22T12:00:00.000Z",
  resolvedAt: null,
};

const pendingDetail: InstitutionalRecoveryDetail = {
  ...pendingRequest,
  candidateUserId: "user-1",
  candidateAssignmentId: "assignment-1",
  currentEmail: "ana.actual@tse.bo",
  accountAddress: "0x1234567890abcdef1234567890abcdef12345678",
  institutionalRole: "TENANT_ADMIN",
  warnings: [],
  resolutionReason: null,
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type RecoveryCaptured = {
  listQueries: string[];
  approveBodies: Record<string, unknown>[];
  approveEmailChangeBodies: Record<string, unknown>[];
  rejectBodies: Record<string, unknown>[];
};

const makeRecoveryFetch = (requestType: "ACCESS_RECOVERY" | "ADMIN_EMAIL_CHANGE" = "ACCESS_RECOVERY") => {
  const captured: RecoveryCaptured = {
    listQueries: [],
    approveBodies: [],
    approveEmailChangeBodies: [],
    rejectBodies: [],
  };
  const detail: InstitutionalRecoveryDetail = { ...pendingDetail, requestType };
  const list: InstitutionalRecoveryListResponse = { data: [detail], total: 1 };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path === "/api/v1/institutional-access-recovery-requests") {
      captured.listQueries.push(url.search);
      return jsonResponse(list);
    }
    if (request.method === "GET" && path === "/api/v1/institutional-access-recovery-requests/request-1") {
      return jsonResponse(detail);
    }
    if (request.method === "POST" && path.endsWith("/request-1/approve")) {
      captured.approveBodies.push((await request.clone().json()) as Record<string, unknown>);
      return jsonResponse({ requestId: "request-1", status: "APPROVED" });
    }
    if (request.method === "POST" && path.endsWith("/request-1/email-change/approve")) {
      captured.approveEmailChangeBodies.push((await request.clone().json()) as Record<string, unknown>);
      return jsonResponse({ requestId: "request-1", status: "APPROVED" });
    }
    if (request.method === "POST" && path.endsWith("/request-1/reject")) {
      captured.rejectBodies.push((await request.clone().json()) as Record<string, unknown>);
      return jsonResponse({ requestId: "request-1", status: "REJECTED" });
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });

  return { captured, fetchMock };
};

const renderAsSuperadmin = (element: ReactElement) =>
  renderWithAuthStore(element, {
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

const openRecoveryDetail = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findAllByText("Tribunal Supremo Electoral");
  await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
  expect(await screen.findByText("ana.actual@tse.bo")).toBeInTheDocument();
};

describe("MX-16 | integración de registros y recuperación institucional", () => {
  beforeEach(() => {
    approvalMocks.applications = [...accessApprovalApplications];
    approvalMocks.details = Object.fromEntries(
      accessApprovalApplications.map((application) => [application.id, application]),
    );
    approvalMocks.approve.mockReset().mockResolvedValue({ status: "APPROVED" });
    approvalMocks.reject.mockReset().mockResolvedValue({ status: "REJECTED" });
    approvalMocks.revoke.mockReset().mockResolvedValue(undefined);
    approvalMocks.reopen.mockReset().mockResolvedValue(undefined);
    approvalMocks.retry.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[MX-16][ADM-REG-P0-001][INTEGRACION] agrupa pestañas y búsqueda, muestra detalle y ejecuta decisiones globales con feedback solo para Superadmin", async () => {
    const user = userEvent.setup();
    renderAsSuperadmin(<RegistrosPage />);

    expect(await screen.findByRole("heading", { name: "Gestión de registros" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Ana Pendiente/i }));
    expect(await screen.findByText("Carnet de identidad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprobar registro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar registro" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar registro" }));
    await waitFor(() => {
      expect(approvalMocks.approve).toHaveBeenCalledWith("app-pending");
    });
    expect(screen.getByText("La autorización fue completada correctamente.")).toBeInTheDocument();
  });

  it("[MX-16][ADM-REC-P0-001][INTEGRACION] lista, filtra, detalla y reintenta recuperaciones institucionales", async () => {
    const user = userEvent.setup();
    const { captured, fetchMock } = makeRecoveryFetch();
    vi.stubGlobal("fetch", fetchMock);

    renderAsSuperadmin(<InstitutionalRecoveryAdminPage />);
    await openRecoveryDetail(user);
    expect(screen.getByText("ana.actual@tse.bo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Cerrar/i }));
    await user.type(screen.getByPlaceholderText(/Buscar institución/i), "tribunal");
    expect(screen.getAllByText("Tribunal Supremo Electoral")).not.toHaveLength(0);
    await user.selectOptions(screen.getByLabelText("Estado"), "APPROVED");
    await user.click(screen.getByRole("button", { name: /^Reintentar$/i }));
    await waitFor(() => {
      expect(captured.listQueries.some((query) => query.includes("status=APPROVED"))).toBe(true);
      expect(captured.listQueries.length).toBeGreaterThan(1);
    });
  });

  it("[MX-16][ADM-REC-P0-002][INTEGRACION] usa endpoints específicos para acceso, cambio de correo y rechazo", async () => {
    const user = userEvent.setup();
    const access = makeRecoveryFetch();
    vi.stubGlobal("fetch", access.fetchMock);
    const first = renderAsSuperadmin(<InstitutionalRecoveryAdminPage />);

    await openRecoveryDetail(user);
    await user.type(screen.getByPlaceholderText(/nota administrativa segura/i), "Identidad validada");
    await user.click(screen.getByRole("button", { name: "Aprobar cambio" }));
    const approvalDialog = screen.getByRole("dialog", { name: /Aprobar cambio de correo/i });
    await user.click(within(approvalDialog).getByRole("button", { name: "Aprobar cambio" }));
    await waitFor(() => {
      expect(access.captured.approveBodies).toEqual([
        { targetUserId: "user-1", targetAssignmentId: "assignment-1", reason: "Identidad validada" },
      ]);
    });

    first.unmount();
    const reject = makeRecoveryFetch();
    vi.stubGlobal("fetch", reject.fetchMock);
    const second = renderAsSuperadmin(<InstitutionalRecoveryAdminPage />);
    await openRecoveryDetail(user);
    await user.type(screen.getByPlaceholderText(/nota administrativa segura/i), "No verificable");
    await user.click(screen.getByRole("button", { name: /^Rechazar$/i }));
    await waitFor(() => {
      expect(reject.captured.rejectBodies).toEqual([{ reason: "No verificable" }]);
    });

    second.unmount();
    const emailChange = makeRecoveryFetch("ADMIN_EMAIL_CHANGE");
    vi.stubGlobal("fetch", emailChange.fetchMock);
    renderAsSuperadmin(<InstitutionalRecoveryAdminPage />);
    await openRecoveryDetail(user);
    await user.click(screen.getByRole("button", { name: "Aprobar cambio" }));
    const emailChangeDialog = screen.getByRole("dialog", { name: /Aprobar cambio de correo/i });
    await user.click(within(emailChangeDialog).getByRole("button", { name: "Aprobar cambio" }));
    await waitFor(() => {
      expect(emailChange.captured.approveEmailChangeBodies).toEqual([{}]);
    });
  });
});
