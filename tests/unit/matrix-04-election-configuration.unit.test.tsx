import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ElectionsPage from "@/features/elections/ElectionsPage";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import AddPositionModal from "@/features/electionConfig/components/AddPositionModal";
import BallotPreview from "@/features/electionConfig/components/BallotPreview";
import PartyModal from "@/features/electionConfig/components/PartyModal";
import {
  getMinimumLocalDateTime,
  MIN_CREATE_LEAD_MS,
} from "@/features/electionConfig/renderUtils";
import { renderWithAuthStore, wizardAuthState } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const createElectionMock = vi.fn();
const getEventsMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ electionId: "evt-1" }),
}));

vi.mock("@/features/elections/data/useElectionRepository", () => ({
  useCreateElection: () => ({ createElection: createElectionMock, creating: false }),
}));

vi.mock("@/components/Modal2", () => ({
  default: ({ children, isOpen = true, title }: { children?: ReactNode; isOpen?: boolean; title?: string }) =>
    isOpen ? <div role="dialog" aria-label={title ?? "Modal"}>{title ? <h2>{title}</h2> : null}{children}</div> : null,
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventsQuery: vi.fn(), useDisableVotingEventMutation: vi.fn(),
  useGetVotingEventQuery: vi.fn(), useGetEventRolesQuery: vi.fn(), useGetEventOptionsQuery: vi.fn(),
  useGetPadronVersionsQuery: vi.fn(), useCreateEventRoleMutation: vi.fn(),
  useUpdateEventRoleMutation: vi.fn(), useDeleteEventRoleMutation: vi.fn(),
}));
vi.mock("@/store/tvd", () => ({
  useGetMyTvdSummaryQuery: vi.fn(), useEstimateMyTvdCapacityMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";
import * as tvdStore from "@/store/tvd";

const party = {
  id: "option-yes", electionId: "evt-1", name: "Sí", colorHex: "#459151", createdAt: "2026-01-01T00:00:00.000Z",
  candidates: [{ id: "candidate-yes", partyId: "option-yes", positionId: "CONSULTA", positionName: "CONSULTA", fullName: "Sí, apruebo", photoUrl: "" }],
};

function renderDashboard() {
  vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
    data: [
      { id: "evt-1", tenantId: "tenant-1", name: "Consejo universitario", objective: "Elegir representantes", state: "DRAFT", status: "DRAFT", votingStart: "2027-06-01T12:00:00.000Z", votingEnd: "2027-06-01T18:00:00.000Z", resultsPublishAt: "2027-06-01T19:00:00.000Z", publishDeadline: "2027-06-01T06:00:00.000Z" },
      { id: "evt-2", tenantId: "tenant-1", name: "Consulta normativa", objective: "Consulta institucional", state: "DRAFT", status: "DRAFT", votingStart: "2027-06-01T12:00:00.000Z", votingEnd: "2027-06-01T18:00:00.000Z", resultsPublishAt: "2027-06-01T19:00:00.000Z", publishDeadline: "2027-06-01T06:00:00.000Z" },
    ], isLoading: false, error: null, refetch: getEventsMock,
  } as any);
  vi.mocked(votingEvents.useDisableVotingEventMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
  vi.mocked(tvdStore.useGetMyTvdSummaryQuery).mockReturnValue({ data: { walletStatus: "MISSING", wallet: null }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() } as any);
  vi.mocked(tvdStore.useEstimateMyTvdCapacityMutation).mockReturnValue([vi.fn(() => ({ unwrap: () => Promise.resolve({ hasEstimatedCapacity: true }) })), { isLoading: false, error: null }] as any);
  return renderWithAuthStore(<ElectionsPage />, {
    token: "token", role: "TENANT_ADMIN", active: true, tenantId: "tenant-1",
    user: { id: "user-1", email: "admin@example.com", name: "Admin", role: "TENANT_ADMIN", active: true, status: "ACTIVE" } as any,
    activeContext: { type: "TENANT", role: "TENANT_ADMIN", tenantId: "tenant-1", label: "Institución" } as any,
  });
}

async function fillValidWizard(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección normal");
  await user.type(screen.getByLabelText("¿Cuál es el objetivo o descripción?"), "Elegir representantes institucionales");
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
  await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T12:00");
  await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T18:00");
  await user.type(screen.getByLabelText("¿Cuándo se muestran los resultados?"), "2027-06-01T19:00");
}

describe("MX-04 | configuración de elecciones | unitarias canónicas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: { id: "evt-1", isReferendum: false }, isLoading: false, isError: false } as any);
    vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(votingEvents.useGetPadronVersionsQuery).mockReturnValue({ data: [], isLoading: false } as any);
  });

  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("[MX-04][ELE-LST-P1-005][UNITARIA] filtra localmente por nombre y descripción", async () => {
    const user = userEvent.setup();
    renderDashboard();
    const search = screen.getByPlaceholderText("Buscar votación...");
    await user.type(search, "normativa");
    expect(screen.getByText("Consulta normativa")).toBeInTheDocument();
    expect(screen.queryByText("Consejo universitario")).not.toBeInTheDocument();
    expect(votingEvents.useGetVotingEventsQuery).toHaveBeenCalledWith({ tenantId: "tenant-1" }, expect.objectContaining({ skip: false }));
  });

  it("[MX-04][ELE-NEW-P0-002][UNITARIA] bloquea datos generales inválidos", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByLabelText("¿A qué institución pertenece?")).toBeInTheDocument();
    expect(screen.queryByLabelText("¿Cuándo abre la votación?")).not.toBeInTheDocument();
    expect(createElectionMock).not.toHaveBeenCalled();
  });

  it("[MX-04][ELE-NEW-P0-003][UNITARIA] conserva datos generales al volver desde fechas", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);
    await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección normal");
    await user.type(screen.getByLabelText("¿Cuál es el objetivo o descripción?"), "Elegir representantes institucionales");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByLabelText("¿Cuándo abre la votación?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByDisplayValue("Elección normal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Elegir representantes institucionales")).toBeInTheDocument();
  });

  it("[MX-04][ELE-TIM-P0-001][UNITARIA] rechaza un cierre anterior a la apertura", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);
    await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección normal");
    await user.type(screen.getByLabelText("¿Cuál es el objetivo o descripción?"), "Elegir representantes institucionales");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T18:00");
    await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T12:00");
    await user.type(screen.getByLabelText("¿Cuándo se muestran los resultados?"), "2027-06-01T12:01");
    await user.tab();
    expect(screen.getByText("Debe ser posterior a la fecha de apertura")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
  });

  it("[MX-04][ELE-TIM-P1-002][UNITARIA] recalcula el mínimo de apertura al recuperar foco", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T12:00:00.000Z"));
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);
    fireEvent.change(screen.getByLabelText("¿A qué institución pertenece?"), { target: { value: "Elección normal" } });
    fireEvent.change(screen.getByLabelText("¿Cuál es el objetivo o descripción?"), { target: { value: "Elegir representantes institucionales" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Siguiente" })); });
    const start = screen.getByLabelText("¿Cuándo abre la votación?");
    expect(start).toHaveAttribute("min", getMinimumLocalDateTime(MIN_CREATE_LEAD_MS, Date.now()));
    vi.setSystemTime(new Date("2026-04-17T12:01:00.000Z"));
    fireEvent.focus(window);
    await act(async () => { await Promise.resolve(); });
    expect(start).toHaveAttribute("min", getMinimumLocalDateTime(MIN_CREATE_LEAD_MS, Date.now()));
  });

  it("[MX-04][ELE-REF-P0-001][UNITARIA] envía una votación normal por defecto", async () => {
    const user = userEvent.setup();
    createElectionMock.mockResolvedValue({ id: "evt-normal" });
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);
    await fillValidWizard(user);
    await user.click(screen.getByRole("button", { name: "CREAR" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(createElectionMock).toHaveBeenCalledWith(expect.objectContaining({ isReferendum: false })));
  });

  it("[MX-04][ELE-REF-P0-002][UNITARIA] exige una pregunta de referéndum con interrogación", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);
    await user.click(screen.getByRole("switch", { name: "¿Es referéndum?" }));
    await user.type(screen.getByLabelText("Nombre del referéndum"), "Consulta");
    await user.type(screen.getByLabelText("Pregunta del referéndum"), "Aprueba la normativa institucional");
    await user.tab();
    expect(screen.getByText("Escribe la pregunta con signos de interrogación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("[MX-04][ELE-REF-P1-003][UNITARIA] presenta opciones de referéndum sin logo", () => {
    render(<PartyModal isOpen onClose={vi.fn()} onSave={vi.fn()} isLoading={false} isReferendum />);
    expect(screen.getByText("Agregar opción")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej: Sí")).toBeInTheDocument();
    expect(screen.queryByText("Logo *")).not.toBeInTheDocument();
  });

  it("[MX-04][ELE-ROL-P0-001][UNITARIA] valida y guarda un cargo con nombre mínimo", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AddPositionModal isOpen onClose={vi.fn()} onSave={onSave} isLoading={false} />);
    await user.type(screen.getByLabelText("¿Por qué cargo se votará?"), "P");
    await user.click(screen.getByRole("button", { name: "Guardar Cargo" }));
    expect(await screen.findByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("¿Por qué cargo se votará?"));
    await user.type(screen.getByLabelText("¿Por qué cargo se votará?"), "Presidencia");
    await user.click(screen.getByRole("button", { name: "Guardar Cargo" }));
    expect(onSave).toHaveBeenCalledWith("Presidencia");
  });

  it("[MX-04][ELE-IMG-P1-001][UNITARIA] acepta imagen de logo y conserva su preview", async () => {
    class FileReaderMock { result: string | ArrayBuffer | null = null; onload: null | (() => void) = null; onloadend: null | (() => void) = null; readAsDataURL(file: File) { this.result = `data:${file.type};base64,mock`; this.onload?.(); this.onloadend?.(); } }
    vi.stubGlobal("FileReader", FileReaderMock);
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PartyModal isOpen onClose={vi.fn()} onSave={onSave} isLoading={false} />);
    fireEvent.change(screen.getByPlaceholderText("Ej: Movimiento Futuro"), { target: { value: "Lista Verde" } });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [new File(["logo"], "logo.png", { type: "image/png" })] } });
    expect(await screen.findByAltText("Logo preview")).toHaveAttribute("src", expect.stringContaining("data:image/png"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar y Continuar" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ logoBase64: expect.stringContaining("data:image/png") }));
    vi.unstubAllGlobals();
  });

  it("[MX-04][ELE-PRV-P1-001][UNITARIA] conserva la boleta normal", () => {
    render(<BallotPreview parties={[party]} />);
    expect(screen.getByText("Elige a tu candidato")).toBeInTheDocument();
    expect(screen.getByText("CONSULTA:")).toBeInTheDocument();
  });

  it("[MX-04][ELE-PRV-P1-002][UNITARIA] usa la pregunta como título del referéndum", () => {
    render(<BallotPreview parties={[party]} isReferendum question="¿Aprueba la nueva normativa?" />);
    expect(screen.getByText("¿Aprueba la nueva normativa?")).toBeInTheDocument();
    expect(screen.queryByText("CONSULTA:")).not.toBeInTheDocument();
  });
});
