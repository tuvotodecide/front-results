import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ElectionsPage from "@/features/elections/ElectionsPage";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const refetchEventsMock = vi.fn();
const createElectionMock = vi.fn();
const refetchReviewMock = vi.fn();
const updateScheduleMock = vi.fn();
const useElectionPublishMock = vi.fn();
const capacityMock = vi.hoisted(() => vi.fn());

vi.mock("@/domains/votacion/navigation/compat-private", () => ({ useNavigate: () => navigateMock, useParams: () => ({ electionId: "evt-1" }) }));
vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>("@/features/electionConfig/renderUtils");
  return { ...actual, useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime() };
});
vi.mock("@/features/elections/data/useElectionRepository", () => ({ useCreateElection: () => ({ createElection: createElectionMock, creating: false }) }));
vi.mock("@/components/Modal2", () => ({ default: ({ children, isOpen = true, title }: { children?: ReactNode; isOpen?: boolean; title?: string }) => isOpen ? <div role="dialog" aria-label={title ?? "Modal"}>{title ? <h2>{title}</h2> : null}{children}</div> : null }));
vi.mock("@/features/electionConfig/data/useElectionPublish", () => ({ useElectionPublish: (...args: unknown[]) => useElectionPublishMock(...args) }));
vi.mock("@/store/tvd", () => ({
  useGetMyTvdSummaryQuery: vi.fn(), useEstimateMyTvdCapacityMutation: vi.fn(),
  useGetVotingEventTvdCapacityQuery: (...args: unknown[]) => capacityMock(...args),
}));
vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventsQuery: vi.fn(), useDisableVotingEventMutation: vi.fn(), useUpdateEventScheduleMutation: vi.fn(),
  useDeleteVotingEventMutation: vi.fn(), useUpdateVotingEventMutation: vi.fn(), useCreatePresentialSessionMutation: vi.fn(), useCreateEventNewsMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";
import * as tvdStore from "@/store/tvd";

const event = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-draft", tenantId: "tenant-1", name: "Elección Consejo 2027", chainRequestId: "chain-1", objective: "Elegir representantes institucionales",
  votingStart: "2027-06-01T12:00:00.000Z", votingEnd: "2027-06-01T18:00:00.000Z", resultsPublishAt: "2027-06-01T19:00:00.000Z", publishDeadline: "2027-06-01T06:00:00.000Z", state: "DRAFT", status: "DRAFT", publicEligibilityEnabled: false, publicEligibility: false, ...overrides,
});
const events = [event(), event({ id: "evt-review", name: "Consulta lista", objective: "Revisión previa", state: "READY_FOR_REVIEW", status: "READY_FOR_REVIEW" }), event({ id: "evt-public", name: "Elección publicada", state: "OFFICIALLY_PUBLISHED", status: "OFFICIALLY_PUBLISHED" }), event({ id: "evt-active", name: "Elección activa", state: "ACTIVE", status: "ACTIVE" }), event({ id: "evt-closed", name: "Elección cerrada", state: "CLOSED", status: "CLOSED" }), event({ id: "evt-results", name: "Elección con resultados", state: "RESULTS_PUBLISHED", status: "RESULTS_PUBLISHED" })];

function renderDashboard(overrides: Record<string, unknown> = {}) {
  vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({ data: events, isLoading: false, error: null, refetch: refetchEventsMock, ...overrides } as any);
  vi.mocked(votingEvents.useDisableVotingEventMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
  vi.mocked(tvdStore.useGetMyTvdSummaryQuery).mockReturnValue({ data: { walletStatus: "MISSING", wallet: null }, isLoading: false, isFetching: false, error: null } as any);
  vi.mocked(tvdStore.useEstimateMyTvdCapacityMutation).mockReturnValue([vi.fn(() => ({ unwrap: () => Promise.resolve({ hasEstimatedCapacity: true }) })), { isLoading: false, error: null }] as any);
  return renderWithAuthStore(<ElectionsPage />, { token: "token", role: "TENANT_ADMIN", active: true, tenantId: "tenant-1", user: { id: "admin-1", role: "TENANT_ADMIN", active: true } as any, activeContext: { type: "TENANT", role: "TENANT_ADMIN", tenantId: "tenant-1", label: "Institución" } as any });
}

async function enterGeneral(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección normal");
  await user.type(screen.getByLabelText("¿Cuál es el objetivo o descripción?"), "Elegir representantes institucionales");
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
}
async function enterCompleteWizard(user: ReturnType<typeof userEvent.setup>) {
  await enterGeneral(user);
  await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T12:00");
  await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T18:00");
  await user.type(screen.getByLabelText("¿Cuándo se muestran los resultados?"), "2027-06-01T19:00");
}

function renderReview() {
  useElectionPublishMock.mockReturnValue({
    votingEvent: event({ id: "evt-1", tenantId: "tenant-1", name: "Elección 2026", votingStart: "2026-04-18T18:00:00.000Z", votingEnd: "2026-04-18T20:00:00.000Z", resultsPublishAt: "2026-04-18T21:00:00.000Z", publishDeadline: "2026-04-18T06:00:00.000Z", state: "READY_FOR_REVIEW", status: "READY_FOR_REVIEW" }),
    ballotPreview: { electionId: "evt-1", electionTitle: "Elección 2026", electionObjective: "Elegir directiva", isReferendum: false, parties: [] },
    configSummary: { positionsOk: true, partiesOk: true, padronOk: true, positionsCount: 1, partiesCount: 1, votersCount: 12, enabledToVoteCount: 10, disabledToVoteCount: 2 }, publicationMissingIdentityCount: 0, publicationPadronCount: 10,
    reviewReadiness: { id: "evt-1", state: "READY_FOR_REVIEW", isReady: true, pending: [], publishDeadline: "2026-04-18T06:00:00.000Z", publicationWindow: { deadline: "2026-04-18T06:00:00.000Z", expired: false, canConfirmOfficialPublication: true, hoursUntilDeadline: 18 } }, loading: false, error: null, electionStatus: "READY_FOR_REVIEW", openReview: vi.fn(), openingReview: false, activateElection: vi.fn(), activating: false, activationResult: null, getShareUrl: vi.fn(), copyToClipboard: vi.fn(), refetch: refetchReviewMock,
  });
  return render(<ElectionConfigReview />);
}

describe("MX-04 | listado y wizard de elecciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createElectionMock.mockReset();
    refetchReviewMock.mockResolvedValue(undefined);
    capacityMock.mockReturnValue({ data: { eventId: "evt-1", participantCount: 10, requiredTokens: "10", availableTokens: "20", missingTokens: "0", canPublish: true, reasonCode: null }, error: null, isLoading: false, isFetching: false, refetch: vi.fn() });
    updateScheduleMock.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
    vi.mocked(votingEvents.useUpdateEventScheduleMutation).mockReturnValue([updateScheduleMock, { isLoading: false }] as any);
    vi.mocked(votingEvents.useDeleteVotingEventMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
    vi.mocked(votingEvents.useUpdateVotingEventMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
    vi.mocked(votingEvents.useCreatePresentialSessionMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
    vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
  });

  it("[MX-04][ELE-LST-P0-001][INTEGRACION] carga sólo las votaciones del tenant activo", () => {
    renderDashboard();
    expect(votingEvents.useGetVotingEventsQuery).toHaveBeenCalledWith({ tenantId: "tenant-1" }, expect.objectContaining({ skip: false }));
    expect(screen.getByText("Elección Consejo 2027")).toBeInTheDocument();
    expect(screen.getByText("Consulta lista")).toBeInTheDocument();
  });
  it("[MX-04][ELE-LST-P1-002][INTEGRACION] muestra carga antes de habilitar acciones", () => {
    renderDashboard({ data: [], isLoading: true });
    expect(screen.getByText("Cargando votaciones...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nueva Votación" })).not.toBeInTheDocument();
  });
  it("[MX-04][ELE-LST-P1-003][INTEGRACION] muestra error y permite reintentar el listado", async () => {
    const user = userEvent.setup();
    renderDashboard({ data: [], error: { status: 503 } });
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetchEventsMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Error al cargar las votaciones")).toBeInTheDocument();
  });
  it("[MX-04][ELE-LST-P1-004][INTEGRACION] ofrece crear desde el listado vacío", async () => {
    const user = userEvent.setup();
    renderDashboard({ data: [] });
    expect(screen.getByText("Bienvenido a Tu voto decide")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear votación" }));
    expect(screen.getByRole("dialog", { name: "Estimar participantes" })).toBeInTheDocument();
  });
  it("[MX-04][ELE-LST-P1-005][INTEGRACION] filtra el listado cargado sin cambiar tenant", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.type(screen.getByPlaceholderText("Buscar votación..."), "consulta");
    expect(screen.getByText("Consulta lista")).toBeInTheDocument();
    expect(screen.queryByText("Elección Consejo 2027")).not.toBeInTheDocument();
    expect(votingEvents.useGetVotingEventsQuery).toHaveBeenLastCalledWith({ tenantId: "tenant-1" }, expect.any(Object));
  });
  it("[MX-04][ELE-LST-P1-006][INTEGRACION] navega según el estado de cada tarjeta", async () => {
    const user = userEvent.setup(); renderDashboard();
    for (const name of ["Elección Consejo 2027", "Consulta lista", "Elección publicada", "Elección activa", "Elección cerrada", "Elección con resultados"]) await user.click(screen.getByText(name));
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-draft/config/cargos");
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-review/config/review");
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-results/status");
  });
  it("[MX-04][ELE-NEW-P0-001][INTEGRACION] inicia el alta desde contexto institucional", async () => {
    const user = userEvent.setup(); renderDashboard({ data: [] });
    await user.click(screen.getByRole("button", { name: "Crear votación" }));
    expect(screen.getByRole("dialog", { name: "Estimar participantes" })).toBeInTheDocument();
    expect(votingEvents.useGetVotingEventsQuery).toHaveBeenCalledWith({ tenantId: "tenant-1" }, expect.any(Object));
  });
  it("[MX-04][ELE-NEW-P0-002][INTEGRACION] mantiene el wizard en datos inválidos", async () => {
    const user = userEvent.setup();
    render(<CreateElectionWizard />);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.queryByLabelText("¿Cuándo abre la votación?")).not.toBeInTheDocument();
    expect(createElectionMock).not.toHaveBeenCalled();
  });
  it("[MX-04][ELE-NEW-P1-004][INTEGRACION] vuelve a datos generales sin perderlos", async () => {
    const user = userEvent.setup(); render(<CreateElectionWizard />);
    await enterGeneral(user); await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByDisplayValue("Elección normal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Elegir representantes institucionales")).toBeInTheDocument();
  });
  it("[MX-04][ELE-NEW-P1-005][INTEGRACION] cancela el wizard sin crear evento", async () => {
    const user = userEvent.setup(); render(<CreateElectionWizard />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones");
    expect(createElectionMock).not.toHaveBeenCalled();
  });
  it("[MX-04][ELE-NEW-P1-007][INTEGRACION] conserva el wizard ante error de creación", async () => {
    const user = userEvent.setup();
    const expectedError = new Error("Nombre duplicado");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    createElectionMock.mockRejectedValue(expectedError);
    try {
      render(<CreateElectionWizard />);
      await enterCompleteWizard(user); await user.click(screen.getByRole("button", { name: "CREAR" })); await user.click(await screen.findByRole("button", { name: "Confirmar" }));
      expect(await screen.findByText("Nombre duplicado")).toBeInTheDocument();
      expect(screen.getByLabelText("¿Cuándo abre la votación?")).toBeInTheDocument();
      expect(errorSpy).toHaveBeenCalledWith("Error creando elección:", expectedError);
    } finally {
      errorSpy.mockRestore();
    }
  });
  it("[MX-04][ELE-TIM-P1-003][INTEGRACION] guarda el cronograma editable desde revisión", async () => {
    const user = userEvent.setup(); renderReview();
    await user.click(screen.getByRole("button", { name: "Horarios" }));
    const section = screen.getByRole("button", { name: "Horarios" }).closest("section")!;
    expect(within(section).getByText("Apertura")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Modificar horarios" }));
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]'));
    await user.clear(inputs[0]!); await user.type(inputs[0]!, "2026-04-18T19:00");
    await user.clear(inputs[1]!); await user.type(inputs[1]!, "2026-04-18T21:00");
    await user.clear(inputs[2]!); await user.type(inputs[2]!, "2026-04-18T22:00");
    await user.click(screen.getByRole("button", { name: "Guardar horarios" }));
    await waitFor(() => expect(updateScheduleMock).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt-1" })));
  });
  it("[MX-04][ELE-REF-P0-001][INTEGRACION] crea normal y navega a cargos", async () => {
    const user = userEvent.setup(); createElectionMock.mockResolvedValue({ id: "evt-created" }); render(<CreateElectionWizard />);
    await enterCompleteWizard(user); await user.click(screen.getByRole("button", { name: "CREAR" })); await user.click(await screen.findByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(createElectionMock).toHaveBeenCalledWith(expect.objectContaining({ isReferendum: false })));
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-created/config/cargos", { replace: true });
  });
});
