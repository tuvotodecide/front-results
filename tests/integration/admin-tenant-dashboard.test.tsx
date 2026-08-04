import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ElectionsPage from "@/features/elections/ElectionsPage";
import type { VotingEvent } from "@/store/votingEvents/types";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>(
    "@/features/electionConfig/renderUtils",
  );
  return {
    ...actual,
    useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime(),
  };
});

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventsQuery: vi.fn(),
  useDeleteVotingEventMutation: vi.fn(),
  useDisableVotingEventMutation: vi.fn(),
}));

vi.mock("@/store/tvd", () => ({
  useGetMyTvdSummaryQuery: vi.fn(),
  useEstimateMyTvdCapacityMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";
import * as tvdStore from "@/store/tvd";

const mockEvents: VotingEvent[] = [
  {
    id: "evt-president",
    tenantId: "tenant-1",
    name: "Elección de Presidente 2026",
    chainRequestId: "chain-1",
    objective: "Elección general",
    votingStart: "2026-08-20T08:00:00.000Z",
    votingEnd: "2026-08-20T17:00:00.000Z",
    resultsPublishAt: "2026-08-20T18:00:00.000Z",
    publishDeadline: "2026-08-19T08:00:00.000Z",
    state: "READY_FOR_REVIEW",
    status: "READY_FOR_REVIEW",
    publicEligibilityEnabled: true,
    publicEligibility: true,
  },
  {
    id: "evt-deputies",
    tenantId: "tenant-1",
    name: "Elección de Diputados",
    chainRequestId: "chain-2",
    objective: "Resultados oficiales",
    votingStart: "2026-06-29T08:00:00.000Z",
    votingEnd: "2026-06-29T17:00:00.000Z",
    resultsPublishAt: "2026-06-29T18:00:00.000Z",
    publishDeadline: "2026-06-28T08:00:00.000Z",
    state: "RESULTS_PUBLISHED",
    status: "RESULTS_PUBLISHED",
    publicEligibilityEnabled: true,
    publicEligibility: true,
    participationPercentage: 73.2,
  } as VotingEvent,
];

const linkedWallet = "0x1234567890abcdef1234567890abcdef12345678";

const tvdSummaryWithWallet = {
  tenantId: "tenant-1",
  assignmentId: "assignment-1",
  wallet: linkedWallet,
  walletStatus: "VERIFIED",
  assignedBalance: {
    smallestUnit: "20000000000000000000",
    formatted: "20",
    decimals: 18,
  },
  liquidBalance: {
    smallestUnit: "80000000000000000000",
    formatted: "80",
    decimals: 18,
  },
  totalBalance: {
    smallestUnit: "100000000000000000000",
    formatted: "100",
    decimals: 18,
  },
  tokenSymbol: "TVD",
  chainId: 84532,
  contractAddress: "0x3333333333333333333333333333333333333333",
  lastAccreditation: null,
  pendingAccreditationsCount: 0,
};

const renderDashboard = (
  events: VotingEvent[] = mockEvents,
  tvdQueryState: Record<string, unknown> = {},
) => {
  vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
    data: events,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as any);
  vi.mocked(votingEvents.useDeleteVotingEventMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as any);
  vi.mocked(votingEvents.useDisableVotingEventMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as any);
  vi.mocked(tvdStore.useGetMyTvdSummaryQuery).mockReturnValue({
    data: tvdSummaryWithWallet,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
    ...tvdQueryState,
  } as any);
  vi.mocked(tvdStore.useEstimateMyTvdCapacityMutation).mockReturnValue([
    vi.fn(() => ({
      unwrap: () =>
        Promise.resolve({
          estimatedParticipants: 100,
          estimatedRequiredTokens: "100",
          availableTokens: "100",
          estimatedMissingTokens: "0",
          hasEstimatedCapacity: true,
          reasonCode: null,
        }),
    })),
    { isLoading: false, error: null },
  ] as any);

  return renderWithAuthStore(<ElectionsPage />, {
    token: "token",
    role: "TENANT_ADMIN",
    active: true,
    tenantId: "tenant-1",
    user: {
      id: "user-1",
      email: "admin@tse.gob.bo",
      name: "Admin",
      role: "TENANT_ADMIN",
      active: true,
      status: "ACTIVE",
    },
    activeContext: {
      type: "TENANT",
      role: "TENANT_ADMIN",
      tenantId: "tenant-1",
      label: "TSE",
    },
  });
};

describe("MX-02 | Gestión de instituciones, administradores y wallets | Frontend Admin | Dashboard institucional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it("D-LIST-001 / D-PERM-004 | renderiza accesos reales, busqueda y votaciones del backend mockeado", () => {
    renderDashboard();

    expect(screen.getByRole("link", { name: /Saldo 100 \$TVD/i })).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cuenta 0x12345678\.\.\.12345678/i })).toBeInTheDocument();
    expect(screen.getByText("0x12345678...12345678")).toBeInTheDocument();
    expect(screen.getByText("Cuenta")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mis Votaciones" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva Votación" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar votación...")).toBeInTheDocument();
    expect(screen.getByText("Elección de Presidente 2026")).toBeInTheDocument();
    expect(screen.getByText("Elección de Diputados")).toBeInTheDocument();
    expect(screen.getByText("En revisión previa")).toBeInTheDocument();
    expect(screen.getByText("Resultados publicados")).toBeInTheDocument();
    expect(screen.getByText("73.2%")).toBeInTheDocument();
    expect(screen.getAllByText(/Inicio:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cierre:/i).length).toBeGreaterThan(0);
  });

  it("[MX-02][SOPORTE-REGRESION][INTEGRACION] filtra votaciones localmente por nombre y muestra estado vacío", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByPlaceholderText("Buscar votación..."), "Diputados");

    expect(screen.getByText("Elección de Diputados")).toBeInTheDocument();
    expect(screen.queryByText("Elección de Presidente 2026")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Buscar votación..."));
    await user.type(screen.getByPlaceholderText("Buscar votación..."), "Sin coincidencias");

    expect(screen.getByText("No encontramos votaciones con ese criterio.")).toBeInTheDocument();
  });

  it("D-LIST-004 | navega desde cuenta", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("link", { name: /Cuenta 0x12345678\.\.\.12345678/i }));
    expect(navigateMock).toHaveBeenCalledWith("/votacion/cuenta-institucional");
  });

  it("D-REG-003 / D-STATE-004 | mantiene votaciones visibles y alerta roja cuando no existe wallet vinculada", () => {
    renderDashboard(mockEvents, {
      data: {
        ...tvdSummaryWithWallet,
        wallet: null,
        walletStatus: "MISSING",
        assignedBalance: null,
        liquidBalance: null,
        totalBalance: null,
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });

    expect(screen.getAllByText("Cuenta pendiente").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Asociar mi cuenta" })).not.toBeInTheDocument();
    expect(screen.getByText("Elección de Presidente 2026")).toBeInTheDocument();
    expect(screen.queryByText("0 TVD")).not.toBeInTheDocument();
    expect(screen.queryByText(/wallet institucional/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Regularizar wallet/i)).not.toBeInTheDocument();
  });

  it("D-RETRY-006 | mantiene votaciones visibles y permite reintentar cuando falla el saldo", async () => {
    const refetchSummary = vi.fn();
    renderDashboard(mockEvents, {
      data: {
        ...tvdSummaryWithWallet,
        wallet: linkedWallet,
        walletStatus: "VERIFIED",
        assignedBalance: null,
        liquidBalance: null,
        totalBalance: null,
      },
      isLoading: false,
      isFetching: false,
      error: { status: 503, data: { code: "TVD_BALANCE_TEMPORARILY_UNAVAILABLE" } },
      refetch: refetchSummary,
    });
    const user = userEvent.setup();

    expect(screen.getByText("Saldo no disponible")).toBeInTheDocument();
    expect(screen.getByText("Elección de Presidente 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(refetchSummary).toHaveBeenCalled();
  });

  it("D-COMPAT-005 | abre estimacion antes de crear y cancelar no navega", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Nueva Votación" }));

    expect(screen.getByRole("dialog", { name: "Estimar participantes" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(navigateMock).not.toHaveBeenCalledWith("/votacion/elecciones/new");
  });
});
