import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";

const route = { electionId: "evt-1" };
const navigateMock = vi.fn(); const refetchMock = vi.fn(); const openReviewMock = vi.fn(); const deleteEventMock = vi.fn(); const updateScheduleMock = vi.fn();
const publishMock = vi.fn(); const capacityMock = vi.hoisted(() => vi.fn());

vi.mock("@/domains/votacion/navigation/compat-private", () => ({ useNavigate: () => navigateMock, useParams: () => route }));
vi.mock("@/features/electionConfig/renderUtils", async () => { const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>("@/features/electionConfig/renderUtils"); return { ...actual, useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime() }; });
vi.mock("@/features/electionConfig/data/useElectionPublish", () => ({ useElectionPublish: (...args: unknown[]) => publishMock(...args) }));
vi.mock("@/store/tvd", () => ({ useGetVotingEventTvdCapacityQuery: (...args: unknown[]) => capacityMock(...args) }));
vi.mock("@/features/electionConfig/components/PhoneMockup", () => ({ default: ({ children }: { children?: ReactNode }) => <div data-testid="phone-mockup">{children}</div> }));
vi.mock("@/features/electionConfig/components/BallotPreview", () => ({ default: ({ isReferendum, question, parties = [] }: { isReferendum?: boolean; question?: string; parties?: Array<{ name: string }> }) => <div data-testid="ballot-preview">{isReferendum ? question : "Elige a tu candidato"}{parties.map((party) => <span key={party.name}>{party.name}</span>)}</div> }));
vi.mock("@/features/electionConfig/components/ConfigSummaryCard", () => ({ default: ({ summary }: { summary: { partiesCount: number } }) => <div data-testid="config-summary">Opciones configuradas: {summary.partiesCount}</div> }));
vi.mock("@/features/electionConfig/components/ScheduleSummaryCard", () => ({ default: () => <div data-testid="schedule-summary">Apertura Cierre Resultados</div> }));
vi.mock("@/features/electionConfig/components/ActivatedSuccessModal", () => ({ default: () => null }));
vi.mock("@/features/electionConfig/components/CreateNewsModal", () => ({ default: () => null }));
vi.mock("@/features/electionConfig/components/ConfigPageFallback", () => ({ default: ({ title, message, actionLabel }: { title: string; message: string; actionLabel: string }) => <div><h1>{title}</h1><p>{message}</p><button>{actionLabel}</button></div> }));
vi.mock("@/components/Modal2", () => ({ default: ({ children, isOpen = true, title }: { children?: ReactNode; isOpen?: boolean; title?: string }) => isOpen ? <div role="dialog" aria-label={title ?? "Modal"}>{title ? <h2>{title}</h2> : null}{children}</div> : null }));
vi.mock("@/store/votingEvents", () => ({ useDeleteVotingEventMutation: vi.fn(), useUpdateEventScheduleMutation: vi.fn(), useUpdateVotingEventMutation: vi.fn(), useCreatePresentialSessionMutation: vi.fn(), useCreateEventNewsMutation: vi.fn() }));
import * as votingEvents from "@/store/votingEvents";

const event = (overrides: Record<string, unknown> = {}) => ({ id: "evt-1", tenantId: "tenant-1", name: "Elección 2026", chainRequestId: "chain-1", objective: "Elegir directiva", votingStart: "2026-04-18T18:00:00.000Z", votingEnd: "2026-04-18T20:00:00.000Z", resultsPublishAt: "2026-04-18T21:00:00.000Z", publishDeadline: "2026-04-18T06:00:00.000Z", state: "READY_FOR_REVIEW", status: "READY_FOR_REVIEW", publicEligibilityEnabled: true, publicEligibility: true, ...overrides });
const readiness = (overrides: Record<string, unknown> = {}) => ({ id: "evt-1", state: "READY_FOR_REVIEW", isReady: true, pending: [], publishDeadline: "2026-04-18T06:00:00.000Z", publicationWindow: { deadline: "2026-04-18T06:00:00.000Z", expired: false, canConfirmOfficialPublication: true, hoursUntilDeadline: 18 }, ...overrides });
function hook(overrides: Record<string, unknown> = {}) { return { votingEvent: event(), ballotPreview: { electionId: "evt-1", electionTitle: "Elección 2026", electionObjective: "Elegir directiva", isReferendum: false, parties: [{ id: "party-1", electionId: "evt-1", name: "Plancha Verde", colorHex: "#459151", candidates: [] }] }, configSummary: { positionsOk: true, partiesOk: true, padronOk: true, positionsCount: 1, partiesCount: 1, votersCount: 12, enabledToVoteCount: 10, disabledToVoteCount: 2 }, publicationMissingIdentityCount: 0, publicationPadronCount: 10, reviewReadiness: readiness(), loading: false, error: null, electionStatus: "READY_FOR_REVIEW", openReview: openReviewMock, openingReview: false, activateElection: vi.fn(), activating: false, activationResult: null, getShareUrl: vi.fn(), copyToClipboard: vi.fn(), refetch: refetchMock, ...overrides }; }
function renderReview(overrides: Record<string, unknown> = {}) { publishMock.mockReturnValue(hook(overrides)); return render(<ElectionConfigReview />); }

describe("MX-04 | revisión y estados de elección", () => {
  beforeEach(() => {
    vi.clearAllMocks(); route.electionId = "evt-1"; refetchMock.mockResolvedValue(undefined); openReviewMock.mockResolvedValue(readiness()); deleteEventMock.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) }); updateScheduleMock.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
    capacityMock.mockReturnValue({ data: { eventId: "evt-1", participantCount: 10, requiredTokens: "10", availableTokens: "20", missingTokens: "0", canPublish: true, reasonCode: null }, error: null, isLoading: false, isFetching: false, refetch: vi.fn() });
    vi.mocked(votingEvents.useDeleteVotingEventMutation).mockReturnValue([deleteEventMock, { isLoading: false }] as any); vi.mocked(votingEvents.useUpdateEventScheduleMutation).mockReturnValue([updateScheduleMock, { isLoading: false }] as any); vi.mocked(votingEvents.useUpdateVotingEventMutation).mockReturnValue([vi.fn(() => ({ unwrap: vi.fn().mockResolvedValue({}) })), { isLoading: false }] as any); vi.mocked(votingEvents.useCreatePresentialSessionMutation).mockReturnValue([vi.fn(() => ({ unwrap: vi.fn().mockResolvedValue({}) })), { isLoading: false }] as any); vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue([vi.fn(() => ({ unwrap: vi.fn().mockResolvedValue({}) })), { isLoading: false }] as any);
  });

  it("[MX-04][ELE-RDY-P1-001][INTEGRACION] muestra el resumen y acordeones de revisión", () => {
    renderReview(); expect(screen.getByRole("heading", { name: "Revisión antes de publicar" })).toBeInTheDocument(); expect(screen.getByTestId("config-summary")).toHaveTextContent("Opciones configuradas: 1");
    for (const label of ["Estado general", "Vista previa para votantes", "Horarios", "Avisos importantes", "Configuración adicional"]) expect(screen.getByRole("button", { name: new RegExp(`^${label}`) })).toBeInTheDocument();
  });
  it("[MX-04][ELE-RDY-P0-002][INTEGRACION] abre revisión normal y refresca el estado", async () => {
    const user = userEvent.setup(); renderReview({ votingEvent: event({ state: "DRAFT", status: "DRAFT" }), reviewReadiness: readiness({ state: "DRAFT" }) });
    await user.click(screen.getByRole("button", { name: "Notificar a los votantes" })); expect(openReviewMock).toHaveBeenCalledTimes(1); expect(refetchMock).toHaveBeenCalled(); expect(navigateMock).not.toHaveBeenCalled();
  });
  it("[MX-04][ELE-RDY-P0-003][INTEGRACION] conserva el preview funcional de referéndum", async () => {
    const user = userEvent.setup(); renderReview({ votingEvent: event({ isReferendum: true, name: "Consulta 2026", objective: "¿Aprueba la normativa?" }), ballotPreview: { electionId: "evt-1", electionTitle: "Consulta 2026", electionObjective: "¿Aprueba la normativa?", isReferendum: true, parties: [{ id: "yes", name: "Sí", colorHex: "#459151", candidates: [] }] }, publicationMissingIdentityCount: 2, reviewReadiness: readiness({ pending: ["padron_validation"] }) });
    await user.click(screen.getByRole("button", { name: /Avisos importantes/i })); expect(screen.getByText(/Existen 2 votantes no registrados/i)).toBeInTheDocument(); await user.click(screen.getByRole("button", { name: /Vista previa para votantes/i })); expect(screen.getAllByTestId("ballot-preview")[0]).toHaveTextContent("¿Aprueba la normativa?");
  });
  it("[MX-04][ELE-EDT-P0-001][INTEGRACION] vuelve al paso estructural editable", async () => {
    const user = userEvent.setup(); renderReview(); await user.click(screen.getByRole("button", { name: "Volver a editar" })); expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones/evt-1/config/cargos");
  });
  it("[MX-04][ELE-EDT-P0-002][INTEGRACION] bloquea edición en estados vencido, activo y cerrado", () => {
    const { rerender } = renderReview({ votingEvent: event({ state: "PUBLICATION_EXPIRED", status: "PUBLICATION_EXPIRED", publishDeadline: "2026-04-17T06:00:00.000Z" }), reviewReadiness: readiness({ state: "PUBLICATION_EXPIRED", isReady: false, pending: ["publication_window_expired"], publicationWindow: { deadline: "2026-04-17T06:00:00.000Z", expired: true, canConfirmOfficialPublication: false, hoursUntilDeadline: 0 } }) });
    expect(screen.getByRole("button", { name: "Eliminar votación vencida" })).toBeInTheDocument();
    publishMock.mockReturnValue(hook({ votingEvent: event({ state: "ACTIVE", status: "ACTIVE", votingStart: "2026-04-17T10:00:00.000Z", votingEnd: "2026-04-17T20:00:00.000Z" }) })); rerender(<ElectionConfigReview />); expect(screen.getByRole("button", { name: "La votación ya está activa" })).toBeDisabled();
    publishMock.mockReturnValue(hook({ votingEvent: event({ state: "CLOSED", status: "CLOSED", votingStart: "2026-04-16T10:00:00.000Z", votingEnd: "2026-04-16T20:00:00.000Z" }) })); rerender(<ElectionConfigReview />); expect(screen.getByRole("button", { name: "La votación ya finalizó" })).toBeDisabled();
  });
  it("[MX-04][ELE-EDT-P1-003][INTEGRACION] muestra fallback con ID de votación inválido", () => {
    route.electionId = ""; renderReview(); expect(screen.getByRole("heading", { name: "ID de votación no válido" })).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Volver a elecciones" })).toBeInTheDocument();
  });
  it("[MX-04][ELE-CANCL-P0-001][INTEGRACION] elimina lógicamente una votación vencida", async () => {
    const user = userEvent.setup(); renderReview({ votingEvent: event({ state: "PUBLICATION_EXPIRED", status: "PUBLICATION_EXPIRED" }), reviewReadiness: readiness({ publicationWindow: { deadline: "2026-04-17T06:00:00.000Z", expired: true, canConfirmOfficialPublication: false, hoursUntilDeadline: 0 } }) });
    await user.click(screen.getByRole("button", { name: "Eliminar votación vencida" })); await waitFor(() => expect(deleteEventMock).toHaveBeenCalledWith("evt-1")); expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones");
  });
  it("[MX-04][ELE-CANCL-P1-002][INTEGRACION] bloquea cancelación de una votación publicada", () => {
    renderReview({ votingEvent: event({ state: "OFFICIALLY_PUBLISHED", status: "OFFICIALLY_PUBLISHED" }) }); expect(screen.getByRole("button", { name: "Publicación oficial confirmada" })).toBeDisabled(); expect(deleteEventMock).not.toHaveBeenCalled();
  });
  it("[MX-04][ELE-HTTP-P0-001][INTEGRACION] conserva edición de horarios ante rechazo de backend", async () => {
    const user = userEvent.setup(); updateScheduleMock.mockReturnValue({ unwrap: vi.fn().mockRejectedValue({ data: { message: "Horario inválido" } }) }); renderReview(); await user.click(screen.getByRole("button", { name: "Horarios" })); await user.click(screen.getByRole("button", { name: "Modificar horarios" }));
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')); await user.clear(inputs[0]!); await user.type(inputs[0]!, "2026-04-18T19:00"); await user.clear(inputs[1]!); await user.type(inputs[1]!, "2026-04-18T21:00"); await user.clear(inputs[2]!); await user.type(inputs[2]!, "2026-04-18T22:00"); await user.click(screen.getByRole("button", { name: "Guardar horarios" }));
    expect(await screen.findByText("Horario inválido")).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Guardar horarios" })).toBeInTheDocument();
  });
  it("[MX-04][ELE-HTTP-P0-002][INTEGRACION] presenta conflicto de revisión sin continuar", () => {
    renderReview({ reviewReadiness: readiness({ isReady: false, pending: ["roles_duplicate"] }) }); expect(screen.getByText(/roles_duplicate|No se puede publicar/i)).toBeInTheDocument(); expect(screen.getByRole("button", { name: /Confirmar publicación oficial/i })).toBeEnabled();
  });
  it("[MX-04][ELE-HTTP-P1-003][INTEGRACION] muestra fallback ante recurso no encontrado", () => {
    renderReview({ votingEvent: undefined, error: "No se encontró la votación", loading: false }); expect(screen.getByRole("heading", { name: "Revisión antes de publicar" })).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Volver a editar" })).toBeInTheDocument();
  });
});
