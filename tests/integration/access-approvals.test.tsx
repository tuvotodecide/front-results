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
  isError: false,
}));

vi.mock("@/store/accessApprovals", () => {
  const mutation = (fn: ReturnType<typeof vi.fn>) => [
    (payload: unknown) => ({
      unwrap: () => fn(payload),
    }),
    { isLoading: false },
  ];

  return {
    useGetInstitutionalApplicationsQuery: () => ({
      data: accessApprovalsMocks.applications,
      isLoading: accessApprovalsMocks.isLoading,
      isError: accessApprovalsMocks.isError,
    }),
    useGetInstitutionalApplicationQuery: (
      applicationId: string,
      options?: { skip?: boolean },
    ) => ({
      data: options?.skip ? undefined : accessApprovalsMocks.details[applicationId],
      isLoading: false,
      isError: false,
    }),
    useApproveInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.approve),
    useRejectInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.reject),
    useRevokeInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.revoke),
    useReopenInstitutionalApplicationMutation: () =>
      mutation(accessApprovalsMocks.reopen),
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

describe("access approvals admin page", () => {
  beforeEach(() => {
    accessApprovalsMocks.applications = [...accessApprovalApplications];
    accessApprovalsMocks.details = Object.fromEntries(
      accessApprovalApplications.map((application) => [application.id, application]),
    );
    accessApprovalsMocks.isLoading = false;
    accessApprovalsMocks.isError = false;
    accessApprovalsMocks.approve.mockReset().mockResolvedValue(undefined);
    accessApprovalsMocks.reject.mockReset().mockResolvedValue(undefined);
    accessApprovalsMocks.revoke.mockReset().mockResolvedValue(undefined);
    accessApprovalsMocks.reopen.mockReset().mockResolvedValue(undefined);
  });

  it("lists pending applications with tab counts and searchable visible data", async () => {
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

  it("shows loading and empty states without backend data", () => {
    accessApprovalsMocks.isLoading = true;
    accessApprovalsMocks.applications = [];

    const { unmount } = renderApprovals();

    expect(screen.getByText("Cargando solicitudes institucionales...")).toBeInTheDocument();

    unmount();
    accessApprovalsMocks.isLoading = false;
    renderApprovals();

    expect(screen.getByText("No hay solicitudes institucionales pendientes.")).toBeInTheDocument();
  });

  it("shows a visible load error instead of treating backend failure as an empty list", () => {
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

  it("approves and rejects a pending application with the expected public payloads", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await screen.findByRole("button", { name: /Ana Pendiente/ });

    await user.click(screen.getByRole("button", { name: "Aprobar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.approve).toHaveBeenCalledWith("app-pending");
    });
    expect(screen.getByText("La solicitud institucional fue aprobada.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rechazar registro" }));

    await waitFor(() => {
      expect(accessApprovalsMocks.reject).toHaveBeenCalledWith({
        applicationId: "app-pending",
      });
    });
    expect(screen.getByText("La solicitud institucional fue rechazada.")).toBeInTheDocument();
  });

  it("revokes approved applications and reports API action errors visibly", async () => {
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

  it("only lets SUPERADMIN reopen rejected or revoked institutional applications", async () => {
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

  it("keeps the selected application detail tied to the visible list item", async () => {
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
