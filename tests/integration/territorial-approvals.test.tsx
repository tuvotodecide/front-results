import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccessApprovalsPage from "@/domains/access-approvals/screens/AccessApprovalsPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const territorial = vi.hoisted(() => ({
  requests: [] as any[],
  approve: vi.fn(),
  reject: vi.fn(),
  revoke: vi.fn(),
  reopen: vi.fn(),
}));

vi.mock("@/store/accessApprovals", () => {
  const mutation = (operation: ReturnType<typeof vi.fn>) => [
    (payload: unknown) => ({ unwrap: () => operation(payload) }),
    { isLoading: false },
  ];
  const emptyQuery = () => ({
    data: [],
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  });

  return {
    useGetInstitutionalApplicationsQuery: emptyQuery,
    useGetInstitutionalApplicationQuery: () => ({ ...emptyQuery(), data: undefined }),
    useApproveInstitutionalApplicationMutation: () => mutation(vi.fn()),
    useRejectInstitutionalApplicationMutation: () => mutation(vi.fn()),
    useRevokeInstitutionalApplicationMutation: () => mutation(vi.fn()),
    useReopenInstitutionalApplicationMutation: () => mutation(vi.fn()),
    useRetryInstitutionalAuthorizationMutation: () => mutation(vi.fn()),
    useGetTerritorialAccessRequestsQuery: () => ({
      data: territorial.requests,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useApproveTerritorialAccessRequestMutation: () => mutation(territorial.approve),
    useRejectTerritorialAccessRequestMutation: () => mutation(territorial.reject),
    useRevokeTerritorialAccessRequestMutation: () => mutation(territorial.revoke),
    useReopenTerritorialAccessRequestMutation: () => mutation(territorial.reopen),
  };
});

const requests = [
  {
    userId: "665f00000000000000000001", dni: "111", name: "Alcaldesa Pendiente", email: "alcaldesa@test.local",
    role: "MAYOR", status: "PENDING_APPROVAL", emailVerified: true,
    votingMunicipalityId: "mun-1", municipalityName: "Sucre", createdAt: "2026-11-10T12:00:00.000Z",
  },
  {
    userId: "665f00000000000000000002", dni: "222", name: "Gobernador Sin Verificar", email: "gob@test.local",
    role: "GOVERNOR", status: "PENDING_EMAIL_VERIFICATION", emailVerified: false,
    votingDepartmentId: "dep-1", departmentName: "La Paz", createdAt: "2026-11-09T12:00:00.000Z",
  },
  {
    userId: "665f00000000000000000003", dni: "333", name: "Gobernadora Aprobada", email: "gob2@test.local",
    role: "GOVERNOR", status: "APPROVED", emailVerified: true,
    votingDepartmentId: "dep-2", departmentName: "Oruro", createdAt: "2026-11-08T12:00:00.000Z",
  },
  {
    userId: "665f00000000000000000004", dni: "444", name: "Alcalde Rechazado", email: "alcalde@test.local",
    role: "MAYOR", status: "REJECTED", reason: "Documentación incompleta",
    votingMunicipalityId: "mun-2", municipalityName: "Potosí", createdAt: "2026-11-07T12:00:00.000Z",
  },
];

const renderTerritorialTab = async (role: "ACCESS_APPROVER" | "SUPERADMIN" = "SUPERADMIN") => {
  const user = userEvent.setup();
  renderWithAuthStore(<AccessApprovalsPage />, {
    token: "token",
    accessToken: "token",
    role,
    active: true,
    activeContext: role === "ACCESS_APPROVER"
      ? { type: "ACCESS_APPROVALS", role: "ACCESS_APPROVER" }
      : { type: "GLOBAL_ADMIN" },
    user: { id: role, email: `${role}@test.local`, name: "Aprobador", role, active: true, status: "ACTIVE" },
  });
  await user.click(screen.getByRole("button", { name: /Territoriales/ }));
  return user;
};

describe("Aprobaciones | pestaña Territoriales", () => {
  beforeEach(() => {
    territorial.requests = requests.map((request) => ({ ...request }));
    territorial.approve.mockReset().mockResolvedValue(undefined);
    territorial.reject.mockReset().mockResolvedValue(undefined);
    territorial.revoke.mockReset().mockResolvedValue(undefined);
    territorial.reopen.mockReset().mockResolvedValue(undefined);
  });

  it("muestra el conteo de pendientes en el selector y lista rol y territorio", async () => {
    renderWithAuthStore(<AccessApprovalsPage />, {
      token: "token", accessToken: "token", role: "SUPERADMIN", active: true,
      activeContext: { type: "GLOBAL_ADMIN" },
      user: { id: "s", email: "s@test.local", name: "S", role: "SUPERADMIN", active: true, status: "ACTIVE" },
    });
    // Solo PENDING_APPROVAL cuenta como pendiente de acción
    expect(screen.getByRole("button", { name: "Territoriales 1" })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: /Territoriales/ }));

    expect(screen.getByRole("button", { name: /Pendientes 2/ })).toBeInTheDocument();
    const card = screen.getByRole("button", { name: /Alcaldesa Pendiente/ });
    expect(card).toHaveTextContent("Alcalde/sa · Municipio de Sucre");
  });

  it("aprueba una solicitud pendiente", async () => {
    const user = await renderTerritorialTab();

    await user.click(screen.getByRole("button", { name: /Alcaldesa Pendiente/ }));
    await user.click(screen.getByRole("button", { name: "Aprobar acceso" }));

    await waitFor(() => expect(territorial.approve).toHaveBeenCalledWith("665f00000000000000000001"));
    expect(screen.getByText("El acceso territorial fue aprobado.")).toBeInTheDocument();
  });

  it("rechaza con la observación escrita", async () => {
    const user = await renderTerritorialTab();

    await user.click(screen.getByRole("button", { name: /Alcaldesa Pendiente/ }));
    await user.type(screen.getByRole("textbox", { name: /Observación/ }), "Falta credencial");
    await user.click(screen.getByRole("button", { name: "Rechazar solicitud" }));

    await waitFor(() =>
      expect(territorial.reject).toHaveBeenCalledWith({
        userId: "665f00000000000000000001",
        reason: "Falta credencial",
      }),
    );
  });

  it("no permite aprobar mientras el correo no esté verificado", async () => {
    const user = await renderTerritorialTab();

    await user.click(screen.getByRole("button", { name: /Gobernador Sin Verificar/ }));

    expect(screen.queryByRole("button", { name: "Aprobar acceso" })).not.toBeInTheDocument();
    expect(screen.getByText(/debe verificar su correo/)).toBeInTheDocument();
  });

  it("revoca un acceso aprobado", async () => {
    const user = await renderTerritorialTab();

    await user.click(screen.getByRole("button", { name: /Aprobados 1/ }));
    await user.click(screen.getByRole("button", { name: /Gobernadora Aprobada/ }));
    await user.click(screen.getByRole("button", { name: "Revocar acceso" }));

    await waitFor(() =>
      expect(territorial.revoke).toHaveBeenCalledWith({
        userId: "665f00000000000000000003",
        reason: undefined,
      }),
    );
  });

  it("reabre una solicitud rechazada", async () => {
    const user = await renderTerritorialTab("ACCESS_APPROVER");

    await user.click(screen.getByRole("button", { name: /Rechazados 1/ }));
    await user.click(screen.getByRole("button", { name: /Alcalde Rechazado/ }));
    expect(screen.getByText("Documentación incompleta")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Marcar como pendiente" }));

    await waitFor(() => expect(territorial.reopen).toHaveBeenCalledWith("665f00000000000000000004"));
  });
});
