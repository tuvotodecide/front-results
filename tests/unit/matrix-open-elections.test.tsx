import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import { renderWithAuthStore, wizardAuthState } from "../utils/renderWithStore";
import ElectionConfigPadron from "@/features/electionConfig/ElectionConfigPadron";

const createElectionMock = vi.fn();
const navigateMock = vi.fn();
const route = { electionId: "evt-1" };

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => route,
}));

vi.mock("@/features/elections/data/useElectionRepository", () => ({
  useCreateElection: () => ({
    createElection: createElectionMock,
    creating: false,
  }),
}));

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) => (isOpen ? <div>{title ? <h2>{title}</h2> : null}{children}</div> : null),
}));

vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>(
    "@/features/electionConfig/renderUtils",
  );
  return { ...actual, useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime() };
});

vi.mock("@/store/votingEvents", () => ({
  useAddPadronStagingEntryMutation: vi.fn(),
  useAnalyzePadronWithGeminiMutation: vi.fn(),
  useBulkDeletePadronStagingEntriesMutation: vi.fn(),
  useConfirmPadronStagingMutation: vi.fn(),
  useDeletePadronStagingEntryMutation: vi.fn(),
  useEnableCurrentPadronVoterMutation: vi.fn(),
  useGetEventOptionsQuery: vi.fn(),
  useGetEventReviewReadinessQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetPadronStagingQuery: vi.fn(),
  useGetPadronVotersQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(),
  useGetVotingEventQuery: vi.fn(),
  useLazyDownloadPadronPdfQuery: vi.fn(),
  useLazyGetPadronImportStatusQuery: vi.fn(),
  useLazyGetPadronStagingQuery: vi.fn(),
  useUpdatePadronStagingEntryMutation: vi.fn(),
  useUploadPadronSourceMutation: vi.fn(),
}));

const estimateCapacityMock = vi.fn();

vi.mock("@/store/tvd", () => ({
  useEstimateMyTvdCapacityMutation: () => [estimateCapacityMock, { isLoading: false }],
}));

vi.mock("@/features/adminTvd/data/useTvdPerCredit", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/adminTvd/data/useTvdPerCredit")
  >("@/features/adminTvd/data/useTvdPerCredit");
  return {
    ...actual,
    fetchTvdPerCredit: vi.fn().mockResolvedValue({
      raw: "1000000000000000000",
      decimals: 18,
      formatted: "1 TVD",
    }),
  };
});

import * as votingEvents from "@/store/votingEvents";

const capacityFor = (participants: string) => ({
  unwrap: vi.fn().mockResolvedValue({
    estimatedParticipants: participants,
    estimatedRequiredTokens: participants,
    availableTokens: "1000",
    availableSmallestUnit: "1000000000000000000000",
    estimatedMissingTokens: "0",
    hasEstimatedCapacity: true,
    reasonCode: null,
  }),
});

async function fillGeneralData(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección normal");
  await user.type(
    screen.getByLabelText("¿Cuál es el objetivo o descripción?"),
    "Elegir representantes institucionales",
  );
  const maxOpenVotersInput = screen.queryByLabelText("¿Cuántos votantes pueden participar?");
  if (maxOpenVotersInput) {
    await user.type(maxOpenVotersInput, "10");
  }
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
}

async function fillScheduleAndCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T12:00");
  await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T18:00");
  await user.type(
    screen.getByLabelText("¿Cuándo se muestran los resultados?"),
    "2027-06-01T19:00",
  );
  await user.click(screen.getByRole("button", { name: "CREAR" }));
  await user.click(await screen.findByRole("button", { name: "Confirmar" }));
}

describe("votación abierta | asistente de creación", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createElectionMock.mockResolvedValue({ id: "evt-open" });
    estimateCapacityMock.mockReturnValue(capacityFor("10"));
  });

  it("EA-P0-01-001 muestra la opción de votación abierta desactivada por defecto", async () => {
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    const toggle = await screen.findByRole("switch", { name: "¿Es votación abierta?" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByText(
        "Activa esta opción si la votación estará disponible para todos los usuarios registrados",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Después no podrás desactivar esta opción."),
    ).not.toBeInTheDocument();
  });

  it("EA-P0-01-002 activa la advertencia de irreversibilidad al activar la votación abierta", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));

    expect(
      screen.getByRole("switch", { name: "¿Es votación abierta?" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText("Después no podrás desactivar esta opción."),
    ).toBeInTheDocument();
  });

  it("EA-P0-01-003 permite desactivar la votación abierta antes de continuar", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    const toggle = screen.getByRole("switch", { name: "¿Es votación abierta?" });
    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(
      screen.queryByText("Después no podrás desactivar esta opción."),
    ).not.toBeInTheDocument();
  });

  it("EA-P0-01-004 conserva la votación abierta activada al volver desde el paso de fechas", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
    await fillGeneralData(user);
    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(
      screen.getByRole("switch", { name: "¿Es votación abierta?" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("EA-P0-02-001 crea una votación abierta y envía isOpenVoting en true al confirmar", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    expect(createElectionMock).toHaveBeenCalledWith(
      expect.objectContaining({ isOpenVoting: true }),
    );
  });

  it("EA-P0-02-002 crea una votación cerrada por defecto cuando no se activa la opción", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    expect(createElectionMock).toHaveBeenCalledWith(
      expect.objectContaining({ isOpenVoting: false }),
    );
  });
});

const padronEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-1",
  tenantId: "tenant-1",
  state: "DRAFT",
  status: "DRAFT",
  name: "Elección abierta",
  objective: "Elegir representantes",
  isOpenVoting: true,
  votingStart: "2026-04-18T12:00:00.000Z",
  votingEnd: "2026-04-18T18:00:00.000Z",
  resultsPublishAt: "2026-04-19T12:00:00.000Z",
  publishDeadline: "2026-04-18T06:00:00.000Z",
  ...overrides,
});

const padronDraft = (overrides: Record<string, unknown> = {}) => ({
  importJobId: "job-1",
  eventId: "evt-1",
  tenantId: "tenant-1",
  sourceType: "PDF",
  status: "PARSED",
  isActiveDraft: true,
  originalFile: { fileName: "padron.pdf", mimeType: "application/pdf", size: 10, sha256: "sha" },
  parser: { provider: "gemini", model: "gemini-test", usedFallback: false },
  summary: {
    parsedCount: 2, validCount: 2, duplicateCount: 0, invalidCount: 0,
    stagingCount: 2, enabledCount: 2, disabledCount: 0, missingIdentityCount: 0,
  },
  errors: [],
  processedAt: "2026-04-16T12:00:00.000Z",
  createdAt: "2026-04-16T12:00:00.000Z",
  updatedAt: "2026-04-16T12:00:00.000Z",
  ...overrides,
});

const padronRefs = { workflow: vi.fn(), review: vi.fn(), staging: vi.fn(), voters: vi.fn() };
const asMutation = (value: unknown) => vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue(value) });

function mockPadronHooks({
  event = padronEvent(),
  pending = [] as string[],
  activeDraft = null as any,
  currentVersion = null as any,
} = {}) {
  vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: event, isLoading: false, isError: false, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({ data: [], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({ data: [], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({ data: { pending }, isLoading: false, isFetching: false, refetch: padronRefs.review } as any);
  vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({ data: { eventId: "evt-1", eventState: event.state, currentVersion, activeDraft }, isLoading: false, isError: false, refetch: padronRefs.workflow } as any);
  vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({ data: { data: [], total: 0, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: !activeDraft, refetch: padronRefs.staging } as any);
  vi.mocked(votingEvents.useGetPadronVotersQuery).mockReturnValue({ data: { voters: [], total: 0, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: !currentVersion, refetch: padronRefs.voters } as any);
  vi.mocked(votingEvents.useLazyGetPadronStagingQuery).mockReturnValue([vi.fn()] as any);
  vi.mocked(votingEvents.useLazyDownloadPadronPdfQuery).mockReturnValue([vi.fn()] as any);
  vi.mocked(votingEvents.useLazyGetPadronImportStatusQuery).mockReturnValue([vi.fn()] as any);
  vi.mocked(votingEvents.useAnalyzePadronWithGeminiMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
  vi.mocked(votingEvents.useUploadPadronSourceMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
  vi.mocked(votingEvents.useAddPadronStagingEntryMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
  vi.mocked(votingEvents.useUpdatePadronStagingEntryMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
  vi.mocked(votingEvents.useDeletePadronStagingEntryMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
  vi.mocked(votingEvents.useBulkDeletePadronStagingEntriesMutation).mockReturnValue([asMutation({ deletedCount: 0 }), { isLoading: false }] as any);
  vi.mocked(votingEvents.useConfirmPadronStagingMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
  vi.mocked(votingEvents.useEnableCurrentPadronVoterMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
}

describe("votación abierta | padrón", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    route.electionId = "evt-1";
    Object.assign(padronRefs, { workflow: vi.fn(), review: vi.fn(), staging: vi.fn(), voters: vi.fn() });
  });

  it("EA-P0-07-001 solicita el padrón en staging con el tamaño de página reducido", async () => {
    mockPadronHooks({ pending: [], activeDraft: padronDraft() });
    render(<ElectionConfigPadron />);

    await waitFor(() => {
      expect(votingEvents.useGetPadronStagingQuery).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: "evt-1", limit: 20 }),
        expect.any(Object),
      );
    });
  });

  it("EA-P0-07-002 muestra la sección de paginación cuando hay más páginas del padrón disponibles", async () => {
    mockPadronHooks({ pending: [], activeDraft: padronDraft() });
    vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({
      data: { data: [], total: 45, totalPages: 3 },
      isFetching: false,
      isError: false,
      isUninitialized: false,
      refetch: padronRefs.staging,
    } as any);
    render(<ElectionConfigPadron />);

    expect(await screen.findByRole("button", { name: "Anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
  });
});
