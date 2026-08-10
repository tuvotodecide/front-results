import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ElectionsPage from "@/features/elections/ElectionsPage";
import type { VotingEvent } from "@/store/votingEvents/types";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const refetchEventsMock = vi.fn();

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
  useDisableVotingEventMutation: vi.fn(),
}));

vi.mock("@/store/tvd", () => ({
  useGetMyTvdSummaryQuery: vi.fn(),
  useEstimateMyTvdCapacityMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";
import * as tvdStore from "@/store/tvd";

const makeEvent = (overrides: Partial<VotingEvent>): VotingEvent => ({
  id: "evt-draft",
  tenantId: "tenant-1",
  name: "Elección Consejo 2027",
  chainRequestId: "chain-1",
  objective: "Elegir representantes institucionales",
  votingStart: "2027-06-01T12:00:00.000Z",
  votingEnd: "2027-06-01T18:00:00.000Z",
  resultsPublishAt: "2027-06-01T19:00:00.000Z",
  publishDeadline: "2027-06-01T06:00:00.000Z",
  state: "DRAFT",
  status: "DRAFT",
  publicEligibilityEnabled: false,
  publicEligibility: false,
  ...overrides,
}) as VotingEvent;

const events: VotingEvent[] = [
  makeEvent({ id: "evt-draft", status: "DRAFT", state: "DRAFT" }),
  makeEvent({
    id: "evt-review",
    name: "Consulta lista",
    objective: "Revisión previa",
    status: "READY_FOR_REVIEW",
    state: "READY_FOR_REVIEW",
  }),
  makeEvent({
    id: "evt-public",
    name: "Elección publicada",
    status: "OFFICIALLY_PUBLISHED",
    state: "OFFICIALLY_PUBLISHED",
  }),
  makeEvent({
    id: "evt-active",
    name: "Elección activa",
    status: "ACTIVE",
    state: "ACTIVE",
  }),
  makeEvent({
    id: "evt-closed",
    name: "Elección cerrada",
    status: "CLOSED",
    state: "CLOSED",
  }),
  makeEvent({
    id: "evt-results",
    name: "Elección con resultados",
    status: "RESULTS_PUBLISHED",
    state: "RESULTS_PUBLISHED",
  }),
];

const renderDashboard = (
  overrides: Partial<ReturnType<typeof votingEvents.useGetVotingEventsQuery>> = {},
  tvdSummary: Record<string, unknown> = { walletStatus: "MISSING", wallet: null },
) => {
  vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
    data: events,
    isLoading: false,
    error: null,
    refetch: refetchEventsMock,
    ...overrides,
  } as any);
  vi.mocked(votingEvents.useDisableVotingEventMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as any);
  vi.mocked(tvdStore.useGetMyTvdSummaryQuery).mockReturnValue({
    data: tvdSummary,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  } as any);
  vi.mocked(tvdStore.useEstimateMyTvdCapacityMutation).mockReturnValue([
    vi.fn(() => ({
      unwrap: () => Promise.resolve({ hasEstimatedCapacity: true }),
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
      email: "admin@example.com",
      name: "Admin",
      role: "TENANT_ADMIN",
      active: true,
      status: "ACTIVE",
    },
    activeContext: {
      type: "TENANT",
      role: "TENANT_ADMIN",
      tenantId: "tenant-1",
      label: "Institución",
    },
  });
};

describe("MX-04 | Creación y configuración de votaciones | Listado frontend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ELE-LST-P0-001 / ELE-LST-P1-005 muestra votaciones del tenant y filtra localmente por texto", async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(votingEvents.useGetVotingEventsQuery).toHaveBeenCalledWith(
      { tenantId: "tenant-1" },
      expect.objectContaining({ skip: false }),
    );
    expect(screen.getByText("Elección Consejo 2027")).toBeInTheDocument();
    expect(screen.getByText("Consulta lista")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Buscar votación..."), "consulta");

    expect(screen.getByText("Consulta lista")).toBeInTheDocument();
    expect(screen.queryByText("Elección Consejo 2027")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Buscar votación..."));
    await user.type(screen.getByPlaceholderText("Buscar votación..."), "sin matches");
    expect(screen.getByText("No encontramos votaciones con ese criterio.")).toBeInTheDocument();
  });

  it("ELE-LST-P1-002 / ELE-LST-P1-003 muestra carga, error y permite reintento", async () => {
    renderDashboard({ data: [], isLoading: true });

    expect(screen.getByText("Cargando votaciones...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nueva Votación" })).not.toBeInTheDocument();

    cleanup();
    renderDashboard({ data: [], isLoading: false, error: { status: 403 } });

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(screen.getByText("Error al cargar las votaciones")).toBeInTheDocument();
    expect(refetchEventsMock).toHaveBeenCalledTimes(1);
  });

  it("ELE-LST-P1-004 / ELE-NEW-P0-001 abre creación desde estado vacío con contexto institucional", async () => {
    const user = userEvent.setup();
    renderDashboard({ data: [] });

    expect(screen.getByText("Bienvenido a Tu voto decide")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear votación" }));
    expect(screen.getByRole("dialog", { name: "Estimar participantes" })).toBeInTheDocument();
  });

  it("ELE-LST-P1-006 navega a configuración, revisión o estado según estado visible", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByText("Elección Consejo 2027"));
    await user.click(screen.getByText("Consulta lista"));
    await user.click(screen.getByText("Elección publicada"));
    await user.click(screen.getByText("Elección activa"));
    await user.click(screen.getByText("Elección cerrada"));
    await user.click(screen.getByText("Elección con resultados"));

    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-draft/config/cargos");
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-review/config/review");
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-public/status");
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-active/status");
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-closed/status");
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-results/status");
  });

  it("ELE-LST-P1-007 permite copiar la dirección de la cuenta desde elecciones", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const wallet = "0x1234567890abcdef1234567890abcdef12345678";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderDashboard({}, { walletStatus: "VERIFIED", wallet, formattedBalance: "100" });

    await user.click(screen.getByRole("button", { name: "Copiar dirección" }));

    expect(writeText).toHaveBeenCalledWith(wallet);
    expect(await screen.findByText("Dirección copiada.")).toBeInTheDocument();
  });

  it("ELE-CANCL-P0-001 / ELE-CANCL-P1-002 no inventa una acción de eliminación en el listado", () => {
    renderDashboard();

    expect(screen.queryByRole("button", { name: /Eliminar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancelar/i })).not.toBeInTheDocument();
  });
});
