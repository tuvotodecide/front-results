import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccessApprovalsPage from "@/domains/access-approvals/screens/AccessApprovalsPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const approvals = vi.hoisted(() => ({
  applications: [] as any[],
  details: {} as Record<string, any>,
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

  return {
    useGetInstitutionalApplicationsQuery: () => ({
      data: approvals.applications,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useGetInstitutionalApplicationQuery: (id: string, options?: { skip?: boolean }) => ({
      data: options?.skip ? undefined : approvals.details[id],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useApproveInstitutionalApplicationMutation: () => mutation(approvals.approve),
    useRejectInstitutionalApplicationMutation: () => mutation(approvals.reject),
    useRevokeInstitutionalApplicationMutation: () => mutation(approvals.revoke),
    useReopenInstitutionalApplicationMutation: () => mutation(approvals.reopen),
    useRetryInstitutionalAuthorizationMutation: () => mutation(vi.fn()),
  };
});

const records = [
  {
    id: "territory-pending", dni: "100", name: "Alcaldesa Pendiente", email: "mayor@test.local",
    institutionName: "Alcaldía de La Paz", tenantId: "mun-lp", status: "PENDING_APPROVAL",
    createdAt: "2026-04-10T12:00:00.000Z", role: "MAYOR", territoryName: "La Paz",
  },
  {
    id: "territory-approved", dni: "200", name: "Gobernador Aprobado", email: "governador@test.local",
    institutionName: "Gobernación de La Paz", tenantId: "dep-lp", status: "APPROVED",
    createdAt: "2026-04-09T12:00:00.000Z", role: "GOVERNOR", territoryName: "La Paz",
  },
  {
    id: "territory-rejected", dni: "300", name: "Alcalde Rechazado", email: "reject@test.local",
    institutionName: "Alcaldía de Sucre", tenantId: "mun-sucre", status: "REJECTED",
    reason: "Territorio incompleto", createdAt: "2026-04-08T12:00:00.000Z", role: "MAYOR", territoryName: "Sucre",
  },
];

const renderApprovals = (role: "ACCESS_APPROVER" | "SUPERADMIN" = "ACCESS_APPROVER") =>
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

describe("MX-10 | aprobaciones de acceso territorial", () => {
  beforeEach(() => {
    approvals.applications = records.map((record) => ({ ...record }));
    approvals.details = Object.fromEntries(approvals.applications.map((record) => [record.id, record]));
    approvals.approve.mockReset().mockResolvedValue(undefined);
    approvals.reject.mockReset().mockResolvedValue(undefined);
    approvals.revoke.mockReset().mockResolvedValue(undefined);
    approvals.reopen.mockReset().mockResolvedValue(undefined);
  });

  it("[MX-10][CON-ACC-P0-001][INTEGRACION] muestra la bandeja territorial con estados, rol, territorio y fechas visibles", async () => {
    const user = userEvent.setup();
    renderApprovals();

    expect(screen.getByRole("heading", { name: "Gestión de registros" })).toBeInTheDocument();
    const pendingApplication = await screen.findByRole("button", { name: /Alcaldesa Pendiente/ });
    expect(pendingApplication).toHaveTextContent("Alcaldía de La Paz");
    expect(screen.getByRole("button", { name: /Pendientes 1/ })).toBeInTheDocument();
    const approvedTab = screen.getByRole("button", { name: /Aprobados 1/ });
    expect(approvedTab).toBeInTheDocument();

    await user.click(approvedTab);

    const approvedApplication = await screen.findByRole("button", { name: /Gobernador Aprobado/ });
    expect(approvedApplication).toHaveTextContent("Gobernación de La Paz");
  });

  it("[MX-10][CON-ACC-P0-002][INTEGRACION] abre una solicitud pendiente, la aprueba y confirma su actualización visible", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await user.click(await screen.findByRole("button", { name: /Alcaldesa Pendiente/ }));
    await user.click(screen.getByRole("button", { name: "Aprobar registro" }));

    await waitFor(() => expect(approvals.approve).toHaveBeenCalledWith("territory-pending"));
    expect(screen.getByText("La operación fue procesada.")).toBeInTheDocument();
  });

  it("[MX-10][CON-ACC-P0-003][INTEGRACION] rechaza una solicitud pendiente y conserva la razón operativa en el detalle", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await user.click(await screen.findByRole("button", { name: /Alcaldesa Pendiente/ }));
    await user.click(screen.getByRole("button", { name: "Rechazar registro" }));

    await waitFor(() => expect(approvals.reject).toHaveBeenCalledWith({ applicationId: "territory-pending" }));
    expect(screen.getByText("La solicitud institucional fue rechazada.")).toBeInTheDocument();
  });

  it("[MX-10][CON-ACC-P0-004][INTEGRACION] revoca una solicitud aprobada y comunica la acción visible", async () => {
    const user = userEvent.setup();
    renderApprovals();

    await user.click(screen.getByRole("button", { name: /Aprobados 1/ }));
    await user.click(await screen.findByRole("button", { name: /Gobernador Aprobado/ }));
    await user.click(screen.getByRole("button", { name: "Revocar registro" }));

    await waitFor(() => expect(approvals.revoke).toHaveBeenCalledWith({ applicationId: "territory-approved" }));
    expect(screen.getByText("El acceso institucional fue revocado.")).toBeInTheDocument();
  });

  it("[MX-10][CON-ACC-P1-005][INTEGRACION] reabre una solicitud rechazada como pendiente desde el rol autorizado", async () => {
    const user = userEvent.setup();
    renderApprovals("SUPERADMIN");

    await user.click(screen.getByRole("button", { name: /Rechazados 1/ }));
    await user.click(await screen.findByRole("button", { name: /Alcalde Rechazado/ }));
    await user.click(screen.getByRole("button", { name: "Marcar como pendiente" }));

    await waitFor(() => expect(approvals.reopen).toHaveBeenCalledWith("territory-rejected"));
    expect(screen.getByText("La solicitud institucional volvió a pendiente.")).toBeInTheDocument();
  });
});
