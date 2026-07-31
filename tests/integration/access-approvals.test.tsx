import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccessApprovalsPage from "@/domains/access-approvals/screens/AccessApprovalsPage";
import { accessApprovalApplications } from "../fixtures/admin/accessApprovals";
import { renderWithAuthStore } from "../utils/renderWithStore";

const accessApprovalsMocks = vi.hoisted(() => ({
  applications: [] as any[],
  details: {} as Record<string, any>,
  isLoading: false,
  approve: vi.fn(),
  reject: vi.fn(),
  revoke: vi.fn(),
  reopen: vi.fn(),
  retry: vi.fn(),
  isError: false,
  approveIsLoading: false,
}));

vi.mock("@/store/accessApprovals", () => {
  const mutation = (fn: ReturnType<typeof vi.fn>) => [
    (payload: unknown) => ({
      unwrap: () => fn(payload),
    }),
    { isLoading: fn === accessApprovalsMocks.approve ? accessApprovalsMocks.approveIsLoading : false },
  ];

  return {
    useGetInstitutionalApplicationsQuery: () => ({
      data: accessApprovalsMocks.applications,
      isLoading: accessApprovalsMocks.isLoading,
      isFetching: false,
      isError: accessApprovalsMocks.isError,
      refetch: vi.fn(),
    }),
    useGetInstitutionalApplicationQuery: (
      applicationId: string,
      options?: { skip?: boolean },
    ) => ({
      data: options?.skip ? undefined : accessApprovalsMocks.details[applicationId],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useApproveInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.approve),
    useRejectInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.reject),
    useRevokeInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.revoke),
    useReopenInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.reopen),
    useRetryInstitutionalAuthorizationMutation: () => mutation(accessApprovalsMocks.retry),
  };
});

const renderApprovals = (role: "ACCESS_APPROVER" | "SUPERADMIN" = "ACCESS_APPROVER") =>
  renderWithAuthStore(<AccessApprovalsPage />, {
    token: "token",
    accessToken: "token",
    role,
    active: true,
    activeContext:
      role === "ACCESS_APPROVER"
        ? { type: "ACCESS_APPROVALS", role: "ACCESS_APPROVER" }
        : { type: "GLOBAL_ADMIN" },
    user: {
      id: `${role.toLowerCase()}-1`,
      email: `${role.toLowerCase()}@test.local`,
      name: role === "ACCESS_APPROVER" ? "Aprobador" : "Superadmin",
      role,
      active: true,
      status: "ACTIVE",
    },
  });

describe("MX-02 | Gestión de instituciones, administradores y wallets | Frontend Admin | Aprobaciones", () => {
  beforeEach(() => {
    accessApprovalsMocks.applications = [...accessApprovalApplications];
    accessApprovalsMocks.details = Object.fromEntries(
      accessApprovalApplications.map((application) => [application.id, application]),
    );
    accessApprovalsMocks.isLoading = false;
    accessApprovalsMocks.isError = false;
    accessApprovalsMocks.approveIsLoading = false;
    accessApprovalsMocks.approve.mockReset().mockResolvedValue(undefined);
    accessApprovalsMocks.reject.mockReset().mockResolvedValue(undefined);
    accessApprovalsMocks.revoke.mockReset().mockResolvedValue(undefined);
    accessApprovalsMocks.reopen.mockReset().mockResolvedValue(undefined);
    accessApprovalsMocks.retry.mockReset().mockResolvedValue(undefined);
  });

  it("D-REQ-001 / D-REQ-002 / D-LIST-002 | lists pending applications with tab counts and searchable visible data", async () => {
    const user = userEvent.setup();
    renderApprovals();

    expect(screen.getByRole("heading", { name: "Gestión de registros" })).toBeInTheDocument();
    expect(screen.getByText("Aprobador")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pendientes 1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aprobados 1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rechazados 2/ })).toBeInTheDocument();

    expect(await screen.findByRole("button", { name: /Ana Pendiente/ })).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Buscar por nombre, carnet, correo o institución..."),
      "sin resultados",
    );

    expect(screen.getByText("No hay solicitudes institucionales pendientes.")).toBeInTheDocument();
  });

  it("D-REQ-003 / D-STATE-001 | shows loading and empty states without backend data", () => {
    accessApprovalsMocks.isLoading = true;
    accessApprovalsMocks.applications = [];

    const { unmount } = renderApprovals();

    expect(screen.getByText("Cargando solicitudes institucionales...")).toBeInTheDocument();

    unmount();
    accessApprovalsMocks.isLoading = false;
    renderApprovals();

    expect(screen.getByText("No hay solicitudes institucionales pendientes.")).toBeInTheDocument();
  });

  it("D-REQ-004 / D-STATE-002 | shows a visible load error instead of treating backend failure as an empty list", () => {
    accessApprovalsMocks.isError = true;
    accessApprovalsMocks.applications = [];

    renderApprovals();

    expect(
      screen.getByText("No se pudieron cargar las solicitudes institucionales. Intenta nuevamente."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No hay solicitudes institucionales pendientes."),
    ).not.toBeInTheDocument();
  });

  it("D-APR-001 / D-APR-003 / D-APR-006 | approves and rejects a pending application with the expected public payloads", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await screen.findByRole("button", { name: /Ana Pendiente/ });

    await user.click(screen.getByRole("button", { name: "Aprobar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.approve).toHaveBeenCalledWith("app-pending");
    });
    expect(screen.getByText("La operación fue procesada.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rechazar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.reject).toHaveBeenCalledWith({
        applicationId: "app-pending",
      });
    });
    expect(screen.getByText("La solicitud institucional fue rechazada.")).toBeInTheDocument();
  });

  it("D-APR-005 / D-SIGN-009 | muestra solicitudes aprobadas pendientes de confirmacion como procesamiento sin acciones manuales", async () => {
    accessApprovalsMocks.applications = [
      {
        id: "app-chain",
        name: "Diana Procesando",
        dni: "445566",
        email: "diana@example.com",
        institutionName: "Institución Procesando",
        tenantId: "tenant-chain",
        status: "PENDING_CHAIN_CONFIRMATION",
        updatedAt: "2000-01-01T00:00:00.000Z",
      },
    ];
    accessApprovalsMocks.details = {
      "app-chain": accessApprovalsMocks.applications[0],
    };

    renderApprovals();

    await screen.findByRole("button", { name: /Diana Procesando/ });
    expect(screen.getAllByText("Procesando autorización").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/más de 24 horas en autorización/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Aprobar registro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechazar registro" })).not.toBeInTheDocument();
  });

  it("D-APR-002 | muestra pendiente de autorizacion desde el telefono sin acceso activo", async () => {
    accessApprovalsMocks.applications = [
      {
        id: "app-mobile",
        name: "Elena Teléfono",
        dni: "778899",
        email: "elena@example.com",
        institutionName: "Institución Teléfono",
        tenantId: "tenant-mobile",
        status: "PENDING_MOBILE_AUTHORIZATION",
      },
    ];
    accessApprovalsMocks.details = {
      "app-mobile": accessApprovalsMocks.applications[0],
    };

    renderApprovals();

    await screen.findByRole("button", { name: /Elena Teléfono/ });
    expect(
      screen.getAllByText("Pendiente de autorización desde tu teléfono").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar registro" })).not.toBeInTheDocument();
  });

  it("D-APR-004 | bloquea doble clic visible mientras la aprobacion esta en curso", async () => {
    accessApprovalsMocks.approveIsLoading = true;
    renderApprovals();

    await screen.findByRole("button", { name: /Ana Pendiente/ });

    expect(screen.getByRole("button", { name: "Aprobar registro" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rechazar registro" })).toBeDisabled();
  });

  it("D-REV-001 / D-REV-002 / D-REV-005 | revokes approved applications and reports API action errors visibly", async () => {
    const user = userEvent.setup();
    accessApprovalsMocks.revoke.mockRejectedValueOnce(new Error("locked"));

    renderApprovals();

    await user.click(screen.getByRole("button", { name: /Aprobados 1/ }));
    await user.click(await screen.findByRole("button", { name: /Bruno Aprobado/ }));
    await user.click(screen.getByRole("button", { name: "Revocar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.revoke).toHaveBeenCalledWith({
        applicationId: "app-approved",
      });
    });
    expect(
      screen.getByText("No se pudo completar la acción. Revisa el estado actual y vuelve a intentarlo."),
    ).toBeInTheDocument();
  });

  it("D-PERM-001 / D-STATE-003 | only lets SUPERADMIN reopen rejected or revoked institutional applications", async () => {
    const user = userEvent.setup();

    const { unmount } = renderApprovals("ACCESS_APPROVER");

    await user.click(screen.getByRole("button", { name: /Rechazados 2/ }));
    await user.click(await screen.findByRole("button", { name: /Carla Rechazada/ }));

    expect(screen.queryByRole("button", { name: "Marcar como pendiente" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Tu rol no puede reabrir solicitudes institucionales rechazadas o revocadas."),
    ).toBeInTheDocument();

    unmount();
    renderApprovals("SUPERADMIN");

    await user.click(screen.getByRole("button", { name: /Rechazados 2/ }));
    const rejectedCard = await screen.findByRole("button", { name: /Carla Rechazada/ });
    await user.click(rejectedCard);
    await user.click(screen.getByRole("button", { name: "Marcar como pendiente" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.reopen).toHaveBeenCalledWith("app-rejected");
    });
    expect(screen.getByText("La solicitud institucional volvió a pendiente.")).toBeInTheDocument();
  });

  it("D-LIST-005 / D-COMPAT-001 | keeps the selected application detail tied to the visible list item", async () => {
    const user = userEvent.setup();
    renderApprovals();

    const pendingCard = await screen.findByRole("button", { name: /Ana Pendiente/ });
    await user.click(pendingCard);

    const detail = screen.getByText("Detalle del registro").closest("aside");
    expect(detail).not.toBeNull();
    expect(within(detail as HTMLElement).getByText("Ana Pendiente")).toBeInTheDocument();
    expect(within(detail as HTMLElement).getByText("tenant-pending")).toBeInTheDocument();
  });
});
