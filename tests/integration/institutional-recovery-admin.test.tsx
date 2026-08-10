import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import InstitutionalRecoveryAdminPage from "@/domains/superadmin/screens/InstitutionalRecoveryAdminPage";
import type {
  InstitutionalRecoveryDetail,
  InstitutionalRecoveryListItem,
  InstitutionalRecoveryListResponse,
} from "@/store/institutionalRecovery";
import { renderWithAuthStore } from "../utils/renderWithStore";

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

const approvedRequest: InstitutionalRecoveryListItem = {
  ...pendingRequest,
  requestId: "request-2",
  institutionName: "Municipio de La Paz",
  fullName: "Luis Perez",
  newEmail: "luis.nuevo@lapaz.bo",
  status: "APPROVED",
  resolvedAt: "2026-07-22T13:00:00.000Z",
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

const approvedDetail: InstitutionalRecoveryDetail = {
  ...approvedRequest,
  candidateUserId: "user-2",
  candidateAssignmentId: "assignment-2",
  currentEmail: "luis.actual@lapaz.bo",
  accountAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  institutionalRole: "TENANT_ADMIN",
  warnings: [],
  resolutionReason: "Verificado",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const renderAdminPage = () =>
  renderWithAuthStore(<InstitutionalRecoveryAdminPage />, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
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
  });

const makeFetchMock = (
  options: {
    detail?: InstitutionalRecoveryDetail;
    approveStatus?: number;
    rejectStatus?: number;
  } = {},
) => {
  const captured = {
    approveBodies: [] as Record<string, unknown>[],
    approveEmailChangeBodies: [] as Record<string, unknown>[],
    rejectBodies: [] as Record<string, unknown>[],
    requests: [] as Request[],
  };
  const list: InstitutionalRecoveryListResponse = {
    data: [pendingRequest, approvedRequest],
    total: 2,
  };
  const detail = options.detail ?? pendingDetail;

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(input);
    captured.requests.push(request);
    const url = new URL(request.url);
    const path = url.pathname;

    if (
      request.method === "GET" &&
      path === "/api/v1/institutional-access-recovery-requests"
    ) {
      const status = url.searchParams.get("status");
      if (status === "APPROVED") {
        return jsonResponse({ data: [approvedRequest], total: 1 });
      }
      return jsonResponse(list);
    }

    if (
      request.method === "GET" &&
      path === "/api/v1/institutional-access-recovery-requests/request-1"
    ) {
      return jsonResponse(detail);
    }

    if (
      request.method === "GET" &&
      path === "/api/v1/institutional-access-recovery-requests/request-2"
    ) {
      return jsonResponse(approvedDetail);
    }

    if (
      request.method === "POST" &&
      path === "/api/v1/institutional-access-recovery-requests/request-1/email-change/approve"
    ) {
      captured.approveEmailChangeBodies.push(
        (await request.clone().json()) as Record<string, unknown>,
      );
      return jsonResponse(
        {
          requestId: "request-1",
          status: options.approveStatus === 409 ? "PENDING" : "APPROVED",
          tenantId: "tenant-1",
          userId: "user-1",
          assignmentId: "assignment-1",
          resolvedAt: "2026-07-22T13:00:00.000Z",
        },
        options.approveStatus ?? 200,
      );
    }

    if (
      request.method === "POST" &&
      path === "/api/v1/institutional-access-recovery-requests/request-1/approve"
    ) {
      captured.approveBodies.push(
        (await request.clone().json()) as Record<string, unknown>,
      );
      return jsonResponse(
        {
          requestId: "request-1",
          status: options.approveStatus === 409 ? "PENDING" : "APPROVED",
          tenantId: "tenant-1",
          userId: "user-1",
          assignmentId: "assignment-1",
          resolvedAt: "2026-07-22T13:00:00.000Z",
        },
        options.approveStatus ?? 200,
      );
    }

    if (
      request.method === "POST" &&
      path === "/api/v1/institutional-access-recovery-requests/request-1/reject"
    ) {
      captured.rejectBodies.push(
        (await request.clone().json()) as Record<string, unknown>,
      );
      return jsonResponse(
        {
          ...detail,
          status: options.rejectStatus === 409 ? "PENDING" : "REJECTED",
          resolvedAt: "2026-07-22T13:00:00.000Z",
          resolutionReason: "No se verifico",
        },
        options.rejectStatus ?? 200,
      );
    }

    return jsonResponse({ message: "Not found" }, 404);
  });

  return { fetchMock, captured };
};

describe("MX-02 | Gestión de instituciones, administradores y wallets | Frontend Admin | Recuperación administrativa", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[MX-02][SOPORTE-RECOVERY][INTEGRACION] lista solicitudes y consulta por estado con el componente real", async () => {
    const user = userEvent.setup();
    const { fetchMock, captured } = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();

    expect(
      screen.getByRole("heading", { name: "Cambio de correo institucional" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/transferir/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nuevo administrador/i)).not.toBeInTheDocument();

    expect((await screen.findAllByText("Tribunal Supremo Electoral")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("ana.nueva@tse.bo").length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByRole("combobox"), "APPROVED");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.any(Request));
    });
    const approvedListRequest = captured.requests.find((request) => {
      const url = new URL(request.url);
      return url.searchParams.get("status") === "APPROVED";
    });
    expect(approvedListRequest).toBeDefined();
    expect(approvedListRequest?.headers.get("authorization")).toBe(
      "Bearer superadmin-token",
    );
    expect(approvedListRequest?.headers.get("x-api-key")).toBeNull();
  });

  it("[MX-02][SOPORTE-RECOVERY][INTEGRACION] muestra detalle de recuperación general y aprueba con body mínimo", async () => {
    const user = userEvent.setup();
    const { captured, fetchMock } = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();

    await screen.findAllByText("Tribunal Supremo Electoral");
    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);

    expect(await screen.findByText("Correo actual")).toBeInTheDocument();
    expect(
      await screen.findByText("ana.actual@tse.bo"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/resetToken/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IDENTITY_API_KEY/i)).not.toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/nota administrativa segura/i),
      "Identidad validada por mesa de ayuda",
    );
    await user.click(screen.getByRole("button", { name: /Aprobar cambio/i }));
    const dialog = screen.getByRole("dialog", {
      name: /Aprobar cambio de correo/i,
    });
    await user.click(within(dialog).getByRole("button", { name: /Aprobar cambio/i }));

    await waitFor(() => {
      expect(captured.approveBodies).toHaveLength(1);
    });
    expect(captured.approveBodies[0]).toEqual({
      targetUserId: "user-1",
      targetAssignmentId: "assignment-1",
      reason: "Identidad validada por mesa de ayuda",
    });
    expect(captured.approveBodies[0]).not.toHaveProperty("wallet");
    expect(captured.approveBodies[0]).not.toHaveProperty("tenantId");
    expect(captured.approveBodies[0]).not.toHaveProperty("role");
    expect(captured.approveBodies[0]).not.toHaveProperty("authVersion");
    expect(captured.approveBodies[0]).not.toHaveProperty("status");
    expect(captured.approveBodies[0]).not.toHaveProperty("resetToken");
    expect(captured.approveBodies[0]).not.toHaveProperty("password");
    expect(await screen.findByText("Operación completada")).toBeInTheDocument();
  });

  it("[MX-02][D-MAIL-003][INTEGRACION] aprueba cambio de correo con endpoint específico y sin reset de contraseña", async () => {
    const user = userEvent.setup();
    const { captured, fetchMock } = makeFetchMock({
      detail: {
        ...pendingDetail,
        requestType: "ADMIN_EMAIL_CHANGE",
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();

    await screen.findAllByText("Tribunal Supremo Electoral");
    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    await user.type(
      await screen.findByPlaceholderText(/nota administrativa segura/i),
      "Aprobado por Superadmin",
    );
    expect(screen.queryByText(/nueva contraseña/i)).not.toBeInTheDocument();
    expect(screen.getByText("Cambio de correo institucional")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Aprobar cambio/i }));
    const dialog = screen.getByRole("dialog", {
      name: /Aprobar cambio de correo/i,
    });
    await user.click(within(dialog).getByRole("button", { name: /Aprobar cambio/i }));

    await waitFor(() => {
      expect(captured.approveEmailChangeBodies).toHaveLength(1);
    });
    expect(captured.approveEmailChangeBodies[0]).toEqual({
      reason: "Aprobado por Superadmin",
    });
    expect(captured.approveBodies).toHaveLength(0);
    expect(captured.approveEmailChangeBodies[0]).not.toHaveProperty("targetUserId");
    expect(captured.approveEmailChangeBodies[0]).not.toHaveProperty("targetAssignmentId");
    expect(captured.approveEmailChangeBodies[0]).not.toHaveProperty("password");
    expect(captured.approveEmailChangeBodies[0]).not.toHaveProperty("resetToken");
    expect(await screen.findByText("Operación completada")).toBeInTheDocument();
    expect(screen.getByText("Cambio de correo aprobado.")).toBeInTheDocument();
  });

  it("[MX-02][D-MAIL-006][INTEGRACION] aprueba el cambio sin exponer ni enviar CI o DNI", async () => {
    const user = userEvent.setup();
    const { captured, fetchMock } = makeFetchMock({
      detail: {
        ...pendingDetail,
        requestType: "ADMIN_EMAIL_CHANGE",
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();

    await screen.findAllByText("Tribunal Supremo Electoral");
    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    const detailDialog = await screen.findByRole("dialog", {
      name: /Detalle de cambio de correo/i,
    });
    expect(within(detailDialog).queryAllByText(/\b(?:CI|DNI)\b/i)).toHaveLength(0);

    await user.type(
      await screen.findByPlaceholderText(/nota administrativa segura/i),
      "Datos de identidad no editables",
    );
    await user.click(screen.getByRole("button", { name: /Aprobar cambio/i }));
    const dialog = screen.getByRole("dialog", {
      name: /Aprobar cambio de correo/i,
    });
    await user.click(within(dialog).getByRole("button", { name: /Aprobar cambio/i }));

    await waitFor(() => {
      expect(captured.approveEmailChangeBodies).toHaveLength(1);
    });
    expect(captured.approveEmailChangeBodies[0]).toEqual({
      reason: "Datos de identidad no editables",
    });
    expect(captured.approveEmailChangeBodies[0]).not.toHaveProperty("dni");
    expect(captured.approveEmailChangeBodies[0]).not.toHaveProperty("ci");
    expect(await screen.findByText("Cambio de correo aprobado.")).toBeInTheDocument();
  });

  it("[MX-02][D-MAIL-004][INTEGRACION] el superadministrador rechaza el cambio sin modificar acceso ni enviar estado manual", async () => {
    const user = userEvent.setup();
    const { captured, fetchMock } = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();

    await screen.findAllByText("Tribunal Supremo Electoral");
    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    await user.type(
      await screen.findByPlaceholderText(/nota administrativa segura/i),
      "No se pudo verificar al solicitante",
    );
    await user.click(screen.getByRole("button", { name: /^Rechazar$/i }));

    await waitFor(() => {
      expect(captured.rejectBodies).toHaveLength(1);
    });
    expect(captured.rejectBodies[0]).toEqual({
      reason: "No se pudo verificar al solicitante",
    });
    expect(captured.rejectBodies[0]).not.toHaveProperty("status");
    expect(captured.rejectBodies[0]).not.toHaveProperty("authVersion");
    expect(captured.rejectBodies[0]).not.toHaveProperty("wallet");
    expect(await screen.findByText("Operación completada")).toBeInTheDocument();
    expect(
      screen.getByText(/No se modificó el correo ni el acceso institucional/i),
    ).toBeInTheDocument();
  });

  it("D-STATE-005 | bloquea aprobacion cuando backend reporta inconsistencia", async () => {
    const user = userEvent.setup();
    const { captured, fetchMock } = makeFetchMock({
      detail: {
        ...pendingDetail,
        candidateUserId: null,
        candidateAssignmentId: null,
        warnings: ["NO_CANDIDATE"],
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();
    await screen.findAllByText("Tribunal Supremo Electoral");
    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);

    expect(screen.getByRole("button", { name: /Aprobar cambio/i })).toBeDisabled();
    expect(screen.queryByText("NO_CANDIDATE")).not.toBeInTheDocument();
    expect(captured.approveBodies).toHaveLength(0);
  });

  it("D-RETRY-004 | no permite resolver nuevamente una solicitud ya aprobada", async () => {
    const user = userEvent.setup();
    const { captured, fetchMock } = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();
    await screen.findAllByText("Municipio de La Paz");
    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[1]);

    expect(await screen.findByText("luis.actual@lapaz.bo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aprobar cambio/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Rechazar$/i })).toBeDisabled();
    expect(captured.approveBodies).toHaveLength(0);
    expect(captured.rejectBodies).toHaveLength(0);
  });

  it("D-RETRY-005 | maneja doble resolucion 409 con mensaje seguro", async () => {
    const user = userEvent.setup();
    const { fetchMock } = makeFetchMock({ approveStatus: 409 });
    vi.stubGlobal("fetch", fetchMock);

    renderAdminPage();
    await screen.findAllByText("Tribunal Supremo Electoral");
    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    await screen.findByText("Correo actual");
    await user.click(screen.getByRole("button", { name: /Aprobar cambio/i }));
    const dialog = screen.getByRole("dialog", {
      name: /Aprobar cambio de correo/i,
    });
    await user.click(within(dialog).getByRole("button", { name: /Aprobar cambio/i }));

    expect(
      await screen.findByText(/La solicitud ya fue resuelta o sus datos cambiaron/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Mongo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
  });
});
