import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const analyzePadronDocumentWithGeminiMock = vi.fn();
const hasGeminiPadronConfigMock = vi.fn(() => true);

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ electionId: "evt-1" }),
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
vi.mock("@/features/electionConfig/data/padronGeminiClient", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/data/padronGeminiClient")>(
    "@/features/electionConfig/data/padronGeminiClient",
  );
  return {
    ...actual,
    analyzePadronDocumentWithGemini: (...args: any[]) =>
      analyzePadronDocumentWithGeminiMock(...args),
    hasGeminiPadronConfig: () => hasGeminiPadronConfigMock(),
  };
});

vi.mock("@/store/votingEvents", () => ({
  useAddCurrentPadronVoterMutation: vi.fn(),
  useAddPadronStagingEntryMutation: vi.fn(),
  useDeletePadronStagingEntryMutation: vi.fn(),
  useEnableCurrentPadronVoterMutation: vi.fn(),
  useGetEventOptionsQuery: vi.fn(),
  useGetEventReviewReadinessQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetPadronStagingQuery: vi.fn(),
  useGetPadronVotersQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(),
  useGetVotingEventQuery: vi.fn(),
  useLazyGetPadronImportStatusQuery: vi.fn(),
  useUploadPadronSourceMutation: vi.fn(),
  useUpdatePadronStagingEntryMutation: vi.fn(),
  useGetVotingEventsQuery: vi.fn(),
  useGetEventResultsQuery: vi.fn(),
  useCreatePresentialSessionMutation: vi.fn(),
  useUpdateEventScheduleMutation: vi.fn(),
  useCreateEventNewsMutation: vi.fn(),
}));

vi.mock("@/features/electionConfig/components/ConfigStepsTabs", () => ({
  default: () => <div data-testid="steps-tabs" />,
}));
vi.mock("@/features/electionConfig/components/ConfigPageFallback", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock("@/components/Modal2", () => ({ default: ({ children }: { children?: any }) => <div>{children}</div> }));
vi.mock("@/features/electionConfig/components/LoadedPadronView", () => ({
  default: ({ file, totalVoters }: any) => (
    <div data-testid="loaded-padron-view">
      <span>{file?.fileName}</span>
      <span>{totalVoters}</span>
    </div>
  ),
}));
vi.mock("@/features/electionConfig/components/PadronDropzone", () => ({
  default: ({ onFileSelect }: any) => (
    <button
      type="button"
      data-testid="padron-dropzone"
      onClick={() =>
        onFileSelect(new File(["padron"], "padron.pdf", { type: "application/pdf" }))
      }
    >
      Cargar padrón
    </button>
  ),
}));
vi.mock("@/features/electionConfig/components/PadronObservationsModal", () => ({
  default: ({ isOpen, errors }: any) =>
    isOpen ? (
      <div data-testid="padron-observations-modal">
        {errors.map((error: any, index: number) => (
          <span key={`${error.code}-${index}`}>{error.message}</span>
        ))}
      </div>
    ) : null,
}));
vi.mock("@/features/electionConfig/components/PadronRecordModal", () => ({
  default: () => null,
}));
vi.mock("@/features/electionConfig/components/PadronStagingView", () => ({
  default: ({ observationsLabel }: any) => <div>{observationsLabel}</div>,
}));
vi.mock("@/features/electionConfig/components/UploadProgressModal", () => ({
  default: () => null,
}));
vi.mock("@/features/electionConfig/components/UploadSummaryModal", () => ({
  default: () => null,
}));
vi.mock("@/features/electionConfig/components/PositionsTable", () => ({
  default: () => <div data-testid="positions-table" />,
}));
vi.mock("@/features/electionConfig/components/PartiesTable", () => ({
  default: () => <div data-testid="parties-table" />,
}));
vi.mock("@/features/electionConfig/components/CreateNewsModal", () => ({
  default: () => null,
}));

import * as votingEvents from "@/store/votingEvents";
import ElectionConfigPadron from "@/features/electionConfig/ElectionConfigPadron";
import ActiveElectionStatusPage from "@/features/electionConfig/ActiveElectionStatusPage";

const baseEvent = {
  id: "evt-1",
  tenantId: "tenant-1",
  state: "DRAFT",
  status: "DRAFT",
  name: "Elección 2026",
  objective: "Elegir directiva",
  votingStart: "2026-04-18T00:00:00.000Z",
  votingEnd: "2026-04-18T02:00:00.000Z",
  resultsPublishAt: "2026-04-18T03:00:00.000Z",
  publishDeadline: "2026-04-17T18:00:00.000Z",
};

const noopMutation = [vi.fn(), { isLoading: false }] as const;
const uploadPadronSourceMock = vi.fn();

describe("padron flow integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    analyzePadronDocumentWithGeminiMock.mockReset();
    hasGeminiPadronConfigMock.mockReturnValue(true);
    uploadPadronSourceMock.mockReset();
    uploadPadronSourceMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ importJobId: "job-upload", status: "PARSED" }),
    });

    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: baseEvent,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({
      data: [{ id: "role-1", name: "Presidencia", maxWinners: 1, createdAt: "2026-01-01T00:00:00.000Z", eventId: "evt-1" }],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({
      data: [{ id: "opt-1", eventId: "evt-1", name: "Lista Azul", color: "#123456", candidates: [{ id: "cand-1", name: "Ana", roleName: "Presidencia" }] }],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({
      data: { pending: [], publicationWindow: { deadline: baseEvent.publishDeadline, expired: false, canConfirmOfficialPublication: true, hoursUntilDeadline: 6 } },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        eventState: "DRAFT",
        currentVersion: {
          padronVersionId: "ver-1",
          createdAt: "2026-04-16T12:00:00.000Z",
          createdBy: "admin-1",
          totals: { validCount: 2, invalidCount: 0, duplicateCount: 0 },
          sourceType: "PDF_IMPORT",
        },
        activeDraft: {
          importJobId: "job-1",
          eventId: "evt-1",
          tenantId: "tenant-1",
          sourceType: "PDF",
          status: "PARSED",
          isActiveDraft: true,
          originalFile: { fileName: "padron.pdf", mimeType: "application/pdf", size: 10, sha256: "sha" },
          parser: { provider: "test", model: null, usedFallback: false },
          summary: {
            parsedCount: 60,
            validCount: 60,
            duplicateCount: 0,
            invalidCount: 0,
            stagingCount: 60,
            enabledCount: 60,
            disabledCount: 0,
            missingIdentityCount: 2,
          },
          errors: [],
          processedAt: "2026-04-16T12:00:00.000Z",
          createdAt: "2026-04-16T12:00:00.000Z",
          updatedAt: "2026-04-16T12:00:00.000Z",
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({
      data: {
        importJob: null,
        data: Array.from({ length: 50 }, (_, index) => ({
          id: `entry-${index}`,
          importJobId: "job-1",
          ci: `100${index}`,
          enabled: true,
          hasIdentity: true,
          sourceKind: "PARSED",
        })),
        page: 1,
        limit: 50,
        total: 60,
        totalPages: 2,
      },
      isFetching: false,
      isError: false,
      isUninitialized: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronVotersQuery).mockReturnValue({
      data: { voters: [], total: 0, totalPages: 0 },
      isFetching: false,
      isError: false,
      isUninitialized: true,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useLazyGetPadronImportStatusQuery).mockReturnValue([vi.fn()] as any);
    vi.mocked(votingEvents.useUploadPadronSourceMutation).mockReturnValue([
      uploadPadronSourceMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useAddPadronStagingEntryMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useUpdatePadronStagingEntryMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useDeletePadronStagingEntryMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useAddCurrentPadronVoterMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useEnableCurrentPadronVoterMutation).mockReturnValue([vi.fn()] as any);
    vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(votingEvents.useGetEventResultsQuery).mockReturnValue({ data: null } as any);
    vi.mocked(votingEvents.useCreatePresentialSessionMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useUpdateEventScheduleMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue(noopMutation as any);
  });

  it("keeps finalize blocked when the active draft still has identities missing outside the current page", () => {
    render(<ElectionConfigPadron />);

    expect(
      screen.getByText(
        "Hay 2 registros del padrón sin identidad verificada en la aplicación electoral. Corrígelos antes de continuar a revisión.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finalizar configuración/i })).toBeDisabled();
  });

  it("shows the autosaved active draft as the current padron source in status before publication", () => {
    const { getByText } = renderWithAuthStore(<ActiveElectionStatusPage />, {
      tenantId: "tenant-1",
      active: true,
      role: "ADMIN",
    });

    expect(getByText("Documento PDF en edición autosalvada")).toBeInTheDocument();
  });

  it("keeps Gemini in the main upload flow and allows informative observations", async () => {
    analyzePadronDocumentWithGeminiMock.mockResolvedValue({
      fileName: "padron.pdf",
      uploadedAt: "2026-04-16T12:00:00.000Z",
      sourceType: "PDF_GEMINI",
      analysisProvider: "GEMINI_CLIENT",
      model: "gemini-test",
      records: [
        {
          id: "record-1",
          carnet: "12345678",
          enabled: true,
          sourceKind: "PARSED",
          sourceRow: 1,
          updatedAt: null,
        },
      ],
      observations: [
        {
          code: "GEMINI_OBSERVATION",
          message: "Encabezado de columna identificado y omitido",
          rowIndex: null,
          rawValue: null,
        },
      ],
    });
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        eventState: "DRAFT",
        currentVersion: null,
        activeDraft: null,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<ElectionConfigPadron />);

    fireEvent.click(screen.getByRole("button", { name: /cargar padrón/i }));

    expect(await screen.findByText(/Gemini detectó observaciones informativas/i)).toBeInTheDocument();
    expect(analyzePadronDocumentWithGeminiMock).toHaveBeenCalledTimes(1);
    expect(uploadPadronSourceMock).toHaveBeenCalledTimes(1);
  });

  it("stops before staging when Gemini finds actionable observations", async () => {
    analyzePadronDocumentWithGeminiMock.mockResolvedValue({
      fileName: "padron.pdf",
      uploadedAt: "2026-04-16T12:00:00.000Z",
      sourceType: "PDF_GEMINI",
      analysisProvider: "GEMINI_CLIENT",
      model: "gemini-test",
      records: [
        {
          id: "record-1",
          carnet: "12345678",
          enabled: true,
          sourceKind: "PARSED",
          sourceRow: 1,
          updatedAt: null,
        },
      ],
      observations: [
        {
          code: "GEMINI_OBSERVATION",
          message: "Fila incompleta que requiere revisión manual",
          rowIndex: 3,
          rawValue: "12345678,",
        },
      ],
    });
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        eventState: "DRAFT",
        currentVersion: null,
        activeDraft: null,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<ElectionConfigPadron />);

    fireEvent.click(screen.getByRole("button", { name: /cargar padrón/i }));

    expect(
      await screen.findByText(/Gemini detectó observaciones que requieren revisión/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("padron-observations-modal")).toBeInTheDocument();
    expect(uploadPadronSourceMock).not.toHaveBeenCalled();
  });
});
