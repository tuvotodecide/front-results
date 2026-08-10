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

type ApprovalApplicationFixture = {
  id: string;
  name: string;
  dni: string;
  email: string;
  institutionName: string;
  tenantId: string;
  status: string;
  updatedAt?: string;
  retryable?: boolean;
  chainTxHash?: string;
};

const setSingleApprovalApplication = (application: ApprovalApplicationFixture) => {
  accessApprovalsMocks.applications = [application];
  accessApprovalsMocks.details = { [application.id]: application };
};

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

  it("[MX-02][D-REQ-001][INTEGRACION] muestra solicitudes pendientes y permite buscar la institución solicitada", async () => {
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

  it("[MX-02][D-STATE-001][INTEGRACION] muestra una solicitud pendiente como pendiente de revisión", async () => {
    setSingleApprovalApplication({
      id: "state-pending-review",
      name: "Solicitud en revisión",
      dni: "111111",
      email: "revision@example.com",
      institutionName: "Institución en revisión",
      tenantId: "tenant-review",
      status: "PENDING_APPROVAL",
    });

    renderApprovals();

    expect(await screen.findByRole("button", { name: /Solicitud en revisión/ })).toBeInTheDocument();
    expect(screen.getAllByText("Pendiente de aprobación").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-STATE-002][INTEGRACION] muestra una solicitud pendiente de autorización desde el teléfono", async () => {
    setSingleApprovalApplication({
      id: "state-mobile-pending",
      name: "Solicitud móvil pendiente",
      dni: "222222",
      email: "movil@example.com",
      institutionName: "Institución móvil",
      tenantId: "tenant-mobile",
      status: "PENDING_MOBILE_AUTHORIZATION",
    });

    renderApprovals();

    expect(await screen.findByRole("button", { name: /Solicitud móvil pendiente/ })).toBeInTheDocument();
    expect(
      screen.getAllByText("Pendiente de autorización desde tu teléfono").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-STATE-003][INTEGRACION] muestra una autorización en procesamiento sin habilitar el acceso", async () => {
    setSingleApprovalApplication({
      id: "state-processing",
      name: "Solicitud procesando",
      dni: "333333",
      email: "procesando@example.com",
      institutionName: "Institución procesando",
      tenantId: "tenant-processing",
      status: "PENDING_CHAIN_CONFIRMATION",
      updatedAt: "2000-01-01T00:00:00.000Z",
    });

    renderApprovals();

    expect(await screen.findByRole("button", { name: /Solicitud procesando/ })).toBeInTheDocument();
    expect(screen.getAllByText("Procesando autorización").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-STATE-004][INTEGRACION] muestra un administrador aprobado con acceso habilitado", async () => {
    setSingleApprovalApplication({
      id: "state-approved",
      name: "Administrador habilitado",
      dni: "444444",
      email: "habilitado@example.com",
      institutionName: "Institución habilitada",
      tenantId: "tenant-approved",
      status: "APPROVED",
    });
    const user = userEvent.setup();

    renderApprovals();
    await user.click(screen.getByRole("button", { name: /Aprobados 1/ }));

    expect(await screen.findByRole("button", { name: /Administrador habilitado/ })).toBeInTheDocument();
    expect(screen.getAllByText("Acceso habilitado").length).toBeGreaterThan(0);
  });

  it("[MX-02][D-STATE-005][INTEGRACION] muestra una solicitud rechazada con su estado final", async () => {
    setSingleApprovalApplication({
      id: "state-rejected",
      name: "Solicitud rechazada",
      dni: "555555",
      email: "rechazada@example.com",
      institutionName: "Institución rechazada",
      tenantId: "tenant-rejected",
      status: "REJECTED",
    });
    const user = userEvent.setup();

    renderApprovals();
    await user.click(screen.getByRole("button", { name: /Rechazados 1/ }));

    expect(await screen.findByRole("button", { name: /Solicitud rechazada/ })).toBeInTheDocument();
    expect(screen.getAllByText("Rechazado").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-SIGN-009][INTEGRACION] mantiene la confirmación de red pendiente sin acceso habilitado", async () => {
    setSingleApprovalApplication({
      id: "sign-network-pending",
      name: "Confirmación pendiente",
      dni: "666666",
      email: "red-pendiente@example.com",
      institutionName: "Institución en confirmación",
      tenantId: "tenant-network-pending",
      status: "PENDING_CHAIN_CONFIRMATION",
    });

    renderApprovals();

    expect(await screen.findByRole("button", { name: /Confirmación pendiente/ })).toBeInTheDocument();
    expect(screen.getAllByText("Procesando autorización").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-SIGN-010][INTEGRACION] muestra una confirmación de red no confirmable sin habilitar acceso", async () => {
    setSingleApprovalApplication({
      id: "sign-network-failed",
      name: "Confirmación no confirmable",
      dni: "777777",
      email: "red-fallida@example.com",
      institutionName: "Institución no confirmable",
      tenantId: "tenant-network-failed",
      status: "CHAIN_FAILED",
      retryable: false,
    });

    renderApprovals();

    expect(await screen.findByRole("button", { name: /Confirmación no confirmable/ })).toBeInTheDocument();
    expect(
      screen.getAllByText("No pudimos completar la autorización").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-SIGN-011][INTEGRACION] muestra acceso habilitado cuando la confirmación de red es exitosa", async () => {
    setSingleApprovalApplication({
      id: "sign-network-approved",
      name: "Confirmación exitosa",
      dni: "888888",
      email: "red-exitosa@example.com",
      institutionName: "Institución confirmada",
      tenantId: "tenant-network-approved",
      status: "APPROVED",
    });
    const user = userEvent.setup();

    renderApprovals();
    await user.click(screen.getByRole("button", { name: /Aprobados 1/ }));

    expect(await screen.findByRole("button", { name: /Confirmación exitosa/ })).toBeInTheDocument();
    expect(screen.getAllByText("Acceso habilitado").length).toBeGreaterThan(0);
  });

  it("[MX-02][D-SIGN-013][INTEGRACION] mantiene la reconciliación local pendiente después de confirmar la red", async () => {
    setSingleApprovalApplication({
      id: "sign-local-reconciliation",
      name: "Actualización local pendiente",
      dni: "999999",
      email: "reconciliacion@example.com",
      institutionName: "Institución por reconciliar",
      tenantId: "tenant-local-reconciliation",
      status: "RECONCILIATION_PENDING",
      chainTxHash: "0xconfirmed",
    });
    const user = userEvent.setup();

    renderApprovals();

    await user.click(await screen.findByRole("button", { name: /Actualización local pendiente/ }));
    const detail = screen.getByText("Detalle del registro").closest("aside");
    expect(detail).not.toBeNull();
    expect(within(detail as HTMLElement).getByText("0xconfirmed")).toBeInTheDocument();
    expect(screen.getAllByText("Procesando autorización").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][SOPORTE-REGRESION][INTEGRACION] muestra carga y estado vacío sin datos del backend", () => {
    accessApprovalsMocks.isLoading = true;
    accessApprovalsMocks.applications = [];

    const { unmount } = renderApprovals();

    expect(screen.getByText("Cargando solicitudes institucionales...")).toBeInTheDocument();

    unmount();
    accessApprovalsMocks.isLoading = false;
    renderApprovals();

    expect(screen.getByText("No hay solicitudes institucionales pendientes.")).toBeInTheDocument();
  });

  it("[MX-02][SOPORTE-REGRESION][INTEGRACION] muestra un error de carga sin tratarlo como lista vacía", () => {
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

  it("[MX-02][D-NEW-006][INTEGRACION] aprueba una solicitud de institución nueva verificada con el identificador público", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await screen.findByRole("button", { name: /Ana Pendiente/ });

    await user.click(screen.getByRole("button", { name: "Aprobar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.approve).toHaveBeenCalledWith("app-pending");
    });
    expect(screen.getByText("La operación fue procesada.")).toBeInTheDocument();
    expect(accessApprovalsMocks.reject).not.toHaveBeenCalled();
  });

  it("[MX-02][D-NEW-007][INTEGRACION] rechaza una solicitud de institución nueva sin aprobarla", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await screen.findByRole("button", { name: /Ana Pendiente/ });

    await user.click(screen.getByRole("button", { name: "Rechazar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.reject).toHaveBeenCalledWith({
        applicationId: "app-pending",
      });
    });
    expect(screen.getByText("La solicitud institucional fue rechazada.")).toBeInTheDocument();
    expect(accessApprovalsMocks.approve).not.toHaveBeenCalled();
  });

  it("[MX-02][D-NEW-009][INTEGRACION] muestra el identificador estable de la institución, distinto de la solicitud", async () => {
    accessApprovalsMocks.applications = [
      {
        id: "application-009",
        name: "Institución estable",
        dni: "101010",
        email: "estable@example.com",
        institutionName: "Colegio Estable",
        tenantId: "institution-009",
        status: "PENDING_CHAIN_CONFIRMATION",
      },
    ];
    accessApprovalsMocks.details = {
      "application-009": accessApprovalsMocks.applications[0],
    };
    const user = userEvent.setup();

    renderApprovals();
    await user.click(await screen.findByRole("button", { name: /Institución estable/ }));

    const detail = screen.getByText("Detalle del registro").closest("aside");
    expect(detail).not.toBeNull();
    expect(within(detail as HTMLElement).getByText("institution-009")).toBeInTheDocument();
    expect(within(detail as HTMLElement).queryByText("application-009")).not.toBeInTheDocument();
  });

  it("[MX-02][D-NEW-010][INTEGRACION] presenta la creación enviada como pendiente de confirmación sin habilitar acciones manuales", async () => {
    accessApprovalsMocks.applications = [
      {
        id: "application-010",
        name: "Creación enviada",
        dni: "202020",
        email: "enviada@example.com",
        institutionName: "Institución enviada",
        tenantId: "institution-010",
        status: "PENDING_CHAIN_CONFIRMATION",
      },
    ];
    accessApprovalsMocks.details = {
      "application-010": accessApprovalsMocks.applications[0],
    };

    renderApprovals();

    expect(await screen.findByRole("button", { name: /Creación enviada/ })).toBeInTheDocument();
    expect(screen.getAllByText("Procesando autorización").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Aprobar registro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechazar registro" })).not.toBeInTheDocument();
  });

  it("[MX-02][D-NEW-011][INTEGRACION] informa el fallo recuperable de creación y ofrece reintentar la autorización", async () => {
    accessApprovalsMocks.applications = [
      {
        id: "application-011",
        name: "Creación recuperable",
        dni: "303030",
        email: "recuperable@example.com",
        institutionName: "Institución recuperable",
        tenantId: "institution-011",
        status: "CHAIN_FAILED",
        retryable: true,
      },
    ];
    accessApprovalsMocks.details = {
      "application-011": accessApprovalsMocks.applications[0],
    };
    accessApprovalsMocks.retry.mockResolvedValueOnce({ outcome: "RETRYABLE_FAILURE" });
    const user = userEvent.setup();

    renderApprovals();
    await user.click(await screen.findByRole("button", { name: "Reintentar autorización" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.retry).toHaveBeenCalledWith("application-011");
    });
    expect(
      screen.getByText("No pudimos completar la autorización. Corrige la causa e inténtalo nuevamente."),
    ).toBeInTheDocument();
  });

  it("[MX-02][D-NEW-012][INTEGRACION] presenta una creación confirmada como acceso habilitado", async () => {
    accessApprovalsMocks.applications = [
      {
        id: "application-012",
        name: "Creación confirmada",
        dni: "404040",
        email: "confirmada@example.com",
        institutionName: "Institución confirmada",
        tenantId: "institution-012",
        status: "APPROVED",
      },
    ];
    accessApprovalsMocks.details = {
      "application-012": accessApprovalsMocks.applications[0],
    };
    const user = userEvent.setup();

    renderApprovals();
    await user.click(screen.getByRole("button", { name: /Aprobados 1/ }));

    expect(await screen.findByRole("button", { name: /Creación confirmada/ })).toBeInTheDocument();
    expect(screen.getAllByText("Acceso habilitado").length).toBeGreaterThan(0);
  });

  it("[MX-02][D-NEW-013][INTEGRACION] conserva la creación en reconciliación sin habilitar el acceso local", async () => {
    accessApprovalsMocks.applications = [
      {
        id: "application-013",
        name: "Creación por reconciliar",
        dni: "505050",
        email: "reconciliar@example.com",
        institutionName: "Institución por reconciliar",
        tenantId: "institution-013",
        status: "RECONCILIATION_PENDING",
      },
    ];
    accessApprovalsMocks.details = {
      "application-013": accessApprovalsMocks.applications[0],
    };

    renderApprovals();

    expect(await screen.findByRole("button", { name: /Creación por reconciliar/ })).toBeInTheDocument();
    expect(screen.getAllByText("Procesando autorización").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-NEW-014][INTEGRACION] muestra el conflicto de creación concurrente sin duplicar la aprobación", async () => {
    accessApprovalsMocks.approve.mockRejectedValueOnce({
      data: { message: "La institución ya fue creada por otra aprobación." },
    });
    const user = userEvent.setup();

    renderApprovals();
    await user.click(await screen.findByRole("button", { name: "Aprobar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.approve).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByText("La institución ya fue creada por otra aprobación."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprobar registro" })).not.toBeDisabled();
  });

  it("[MX-02][D-APR-005][INTEGRACION] mantiene una aprobación concurrente en procesamiento sin acciones manuales", async () => {
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

  it("[MX-02][D-APR-002][INTEGRACION] muestra pendiente de autorización móvil sin acceso activo", async () => {
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

  it("[MX-02][D-APR-004][INTEGRACION] bloquea el doble clic mientras la aprobación está en curso", async () => {
    accessApprovalsMocks.approveIsLoading = true;
    renderApprovals();

    await screen.findByRole("button", { name: /Ana Pendiente/ });

    expect(screen.getByRole("button", { name: "Aprobar registro" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rechazar registro" })).toBeDisabled();
  });

  it("[MX-02][D-REQ-004][INTEGRACION] rechaza una solicitud pendiente con el payload público y sin habilitar acceso", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await user.click(await screen.findByRole("button", { name: "Rechazar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.reject).toHaveBeenCalledWith({ applicationId: "app-pending" });
    });
    expect(screen.getByText("La solicitud institucional fue rechazada.")).toBeInTheDocument();
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
    expect(accessApprovalsMocks.approve).not.toHaveBeenCalled();
  });

  it("[MX-02][D-REQ-006][INTEGRACION] muestra el rechazo de aprobación de una solicitud interna desde el rol global", async () => {
    accessApprovalsMocks.approve.mockRejectedValueOnce({
      data: { message: "Las solicitudes internas deben ser aprobadas por el administrador principal." },
    });
    const user = userEvent.setup();
    renderApprovals("SUPERADMIN");

    await user.click(await screen.findByRole("button", { name: "Aprobar registro" }));

    await waitFor(() => expect(accessApprovalsMocks.approve).toHaveBeenCalledWith("app-pending"));
    expect(
      screen.getByText("Las solicitudes internas deben ser aprobadas por el administrador principal."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-APR-001][INTEGRACION] no muestra aviso móvil antes de que el principal apruebe", async () => {
    renderApprovals();

    expect(await screen.findByRole("button", { name: /Ana Pendiente/ })).toBeInTheDocument();
    expect(screen.queryByText("Pendiente de autorización desde tu teléfono")).not.toBeInTheDocument();
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-APR-003][INTEGRACION] dirige la autorización móvil únicamente a la solicitud seleccionada del principal", async () => {
    accessApprovalsMocks.approve.mockResolvedValueOnce({ status: "PENDING_MOBILE_AUTHORIZATION" });
    const user = userEvent.setup();
    renderApprovals();

    await user.click(await screen.findByRole("button", { name: "Aprobar registro" }));

    await waitFor(() => expect(accessApprovalsMocks.approve).toHaveBeenCalledWith("app-pending"));
    expect(screen.getByText("La solicitud quedó pendiente de autorización desde el teléfono.")).toBeInTheDocument();
    expect(accessApprovalsMocks.approve).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][D-APR-006][INTEGRACION] rechaza sin crear una autorización móvil", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await user.click(await screen.findByRole("button", { name: "Rechazar registro" }));

    await waitFor(() => expect(accessApprovalsMocks.reject).toHaveBeenCalledWith({ applicationId: "app-pending" }));
    expect(screen.getByText("La solicitud institucional fue rechazada.")).toBeInTheDocument();
    expect(screen.queryByText("Pendiente de autorización desde tu teléfono")).not.toBeInTheDocument();
    expect(accessApprovalsMocks.approve).not.toHaveBeenCalled();
  });

  it("[MX-02][D-REQ-009][INTEGRACION] el administrador principal rechaza una solicitud desde su revisión", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await user.click(await screen.findByRole("button", { name: /Ana Pendiente/ }));
    await user.click(screen.getByRole("button", { name: "Rechazar registro" }));

    await waitFor(() => expect(accessApprovalsMocks.reject).toHaveBeenCalledWith({ applicationId: "app-pending" }));
    expect(screen.getByText("La solicitud institucional fue rechazada.")).toBeInTheDocument();
    expect(screen.queryByText("Acceso habilitado")).not.toBeInTheDocument();
  });

  it("[MX-02][SOPORTE-REVOCACION][INTEGRACION] revoca solicitudes aprobadas y muestra errores de API", async () => {
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

  it("[MX-02][SOPORTE-REGRESION][INTEGRACION] solo permite a SUPERADMIN reabrir solicitudes rechazadas o revocadas", async () => {
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

  it("[MX-02][SOPORTE-APROBACIONES][INTEGRACION] mantiene el detalle vinculado al elemento visible", async () => {
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
