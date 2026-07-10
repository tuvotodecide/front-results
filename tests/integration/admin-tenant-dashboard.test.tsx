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

import * as votingEvents from "@/store/votingEvents";

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

const renderDashboard = (events: VotingEvent[] = mockEvents) => {
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

describe("Admin tenant dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it("renderiza cards mock, búsqueda y votaciones del backend mockeado", () => {
    renderDashboard();

    expect(screen.getByText("SALDO $TVD")).toBeInTheDocument();
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

  it("filtra votaciones localmente por nombre y muestra estado vacío", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByPlaceholderText("Buscar votación..."), "Diputados");

    expect(screen.getByText("Elección de Diputados")).toBeInTheDocument();
    expect(screen.queryByText("Elección de Presidente 2026")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Buscar votación..."));
    await user.type(screen.getByPlaceholderText("Buscar votación..."), "Sin coincidencias");

    expect(screen.getByText("No encontramos votaciones con ese criterio.")).toBeInTheDocument();
  });

  it("navega desde cards de saldo y cuenta", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Ir a recarga operativa" }));
    expect(navigateMock).toHaveBeenCalledWith("/votacion/recarga-operativa");

    await user.click(screen.getByRole("button", { name: "Ir a cuenta institucional" }));
    expect(navigateMock).toHaveBeenCalledWith("/votacion/cuenta-institucional");
  });

  it("abre estimación antes de crear y cancelar no navega", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Nueva Votación" }));

    expect(screen.getByRole("dialog", { name: "Estimar empadronados" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(navigateMock).not.toHaveBeenCalledWith("/votacion/elecciones/new");
  });
});
