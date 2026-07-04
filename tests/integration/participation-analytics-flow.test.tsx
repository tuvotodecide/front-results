import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ActiveElectionStatusPage from "@/features/electionConfig/ActiveElectionStatusPage";
import { captureElementAsPng } from "@/features/electionConfig/captureElementAsPng";
import { renderWithAuthStore } from "../utils/renderWithStore";
import * as votingEvents from "@/store/votingEvents";

const navigateMock = vi.fn();

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
    useClientNow: () => new Date("2026-07-04T12:00:00.000Z").getTime(),
  };
});

vi.mock("@/components/Modal2", () => ({
  default: ({ children, isOpen = true }: { children?: ReactNode; isOpen?: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("@/features/electionConfig/captureElementAsPng", () => ({
  captureElementAsPng: vi.fn(),
}));

vi.mock("@/features/electionConfig/components/ConfigStepsTabs", () => ({
  default: () => <div data-testid="steps-tabs" />,
}));
vi.mock("@/features/electionConfig/components/PositionsTable", () => ({
  default: () => <div data-testid="positions-table" />,
}));
vi.mock("@/features/electionConfig/components/PartiesTable", () => ({
  default: () => <div data-testid="parties-table" />,
}));
vi.mock("@/features/electionConfig/components/LoadedPadronView", () => ({
  default: () => <div data-testid="loaded-padron" />,
}));
vi.mock("@/features/electionConfig/components/CreateNewsModal", () => ({
  default: () => null,
}));
vi.mock("@/features/padronCheck", () => ({
  PadronCheckModal: () => null,
}));

vi.mock("@/store/votingEvents", () => ({
  useCreateEventNewsMutation: vi.fn(),
  useCreatePresentialSessionMutation: vi.fn(),
  useDownloadParticipationReportWithScreenshotMutation: vi.fn(),
  useEnableCurrentPadronVoterMutation: vi.fn(),
  useGetEventOptionsQuery: vi.fn(),
  useGetEventResultsQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetPadronStagingQuery: vi.fn(),
  useGetPadronVotersQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(),
  useGetParticipationAnalyticsQuery: vi.fn(),
  useGetVotingEventQuery: vi.fn(),
  useGetVotingEventsQuery: vi.fn(),
  useLazyDownloadPadronPdfQuery: vi.fn(),
  useUpdateEventScheduleMutation: vi.fn(),
}));

describe("participation analytics flow", () => {
  const downloadReport = vi.fn();
  const baseVotingEvent = {
    id: "evt-1",
    tenantId: "tenant-1",
    chainRequestId: "chain-1",
    name: "Elección de Diputados",
    objective: "Elegir representantes",
    votingStart: "2026-07-04T10:00:00.000Z",
    votingEnd: "2026-07-04T14:00:00.000Z",
    resultsPublishAt: "2026-07-04T15:00:00.000Z",
    publishDeadline: "2026-07-03T10:00:00.000Z",
    state: "OFFICIALLY_PUBLISHED",
    status: "OFFICIALLY_PUBLISHED",
    publicEligibilityEnabled: true,
    publicEligibility: true,
    presentialKioskEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    vi.mocked(captureElementAsPng).mockResolvedValue("data:image/png;base64,modal-real");
    downloadReport.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        ok: true,
        fileName: "participation-report-evt-1.pdf",
      }),
    });

    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: baseVotingEvent,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: { eventId: "evt-1", currentVersion: null, activeDraft: null },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronVotersQuery).mockReturnValue({
      data: { voters: [], total: 0, totalPages: 1 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({
      data: { data: [], total: 0, totalPages: 1 },
      isLoading: false,
    } as any);
    vi.mocked(votingEvents.useGetEventResultsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: {
        votingId: "evt-1",
        votingName: "Elección de Diputados",
        institutionName: "Institución QA",
        status: "IN_PROGRESS",
        publishedAt: null,
        totalEnabled: 100,
        totalParticipated: 70,
        totalPending: 30,
        participationPercentage: 70,
      },
      isFetching: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useDownloadParticipationReportWithScreenshotMutation).mockReturnValue([
      downloadReport,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useLazyDownloadPadronPdfQuery).mockReturnValue([vi.fn()] as any);
    vi.mocked(votingEvents.useEnableCurrentPadronVoterMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useUpdateEventScheduleMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreatePresentialSessionMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
  });

  it("abre el modal desde la pantalla y descarga reporte con captura real", async () => {
    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "token",
      role: "ADMIN",
      active: true,
      tenantId: "tenant-1",
    });

    await userEvent.click(screen.getByRole("button", { name: "Analíticas" }));

    await waitFor(() => {
      expect(votingEvents.useGetParticipationAnalyticsQuery).toHaveBeenCalledWith(
        "evt-1",
        expect.objectContaining({ skip: false }),
      );
    });
    expect(screen.getAllByText("Elección de Diputados").length).toBeGreaterThan(0);
    expect(screen.getByText("Habilitados")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getAllByText("Pendientes").length).toBeGreaterThanOrEqual(2);

    await userEvent.click(screen.getByRole("button", { name: "Descargar reporte" }));

    await waitFor(() => {
      expect(captureElementAsPng).toHaveBeenCalledWith(
        screen.getByTestId("participation-analytics-capture"),
      );
      expect(downloadReport).toHaveBeenCalledWith({
        eventId: "evt-1",
        modalScreenshot: "data:image/png;base64,modal-real",
      });
    });
  });

  it("no muestra el botón Analíticas para usuario sin rol autorizado", () => {
    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "token-user",
      role: "USER",
      active: true,
      tenantId: "tenant-1",
    });

    expect(screen.queryByRole("button", { name: "Analíticas" })).not.toBeInTheDocument();
  });

  it("muestra Analíticas para contexto institucional tenant propio aunque el rol textual no sea TENANT_ADMIN", () => {
    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "tenant-context-token",
      role: "GOVERNOR",
      active: true,
      tenantId: "tenant-1",
      activeContext: {
        type: "TENANT",
        role: "GOVERNOR",
        tenantId: "tenant-1",
        tenantName: "Institución QA",
      },
    });

    expect(screen.getByRole("button", { name: "Analíticas" })).toBeInTheDocument();
  });

  it("oculta Analíticas para contexto tenant de otra institución", () => {
    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "other-tenant-context-token",
      role: "GOVERNOR",
      active: true,
      tenantId: "tenant-2",
      activeContext: {
        type: "TENANT",
        role: "GOVERNOR",
        tenantId: "tenant-2",
        tenantName: "Otra institución",
      },
    });

    expect(screen.queryByRole("button", { name: "Analíticas" })).not.toBeInTheDocument();
  });

  it.each([
    ["votación en curso", { state: "OFFICIALLY_PUBLISHED", status: "OFFICIALLY_PUBLISHED" }],
    ["votación finalizada", { state: "CLOSED", status: "CLOSED" }],
    ["resultados publicados", { state: "RESULTS_PUBLISHED", status: "RESULTS_PUBLISHED" }],
    ["resultados no publicados", { state: "PUBLISHED", status: "PUBLISHED" }],
  ])("muestra Analíticas en %s sin depender de resultados electorales", (_caseName, eventState) => {
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: { ...baseVotingEvent, ...eventState },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useGetEventResultsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "token",
      role: "ADMIN",
      active: true,
      tenantId: "tenant-1",
    });

    expect(screen.getByRole("button", { name: "Analíticas" })).toBeInTheDocument();
  });

  it("muestra error controlado si falla analytics dentro del modal", async () => {
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: true,
      error: { data: { message: "No autorizado" } },
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "token",
      role: "ADMIN",
      active: true,
      tenantId: "tenant-1",
    });

    await userEvent.click(screen.getByRole("button", { name: "Analíticas" }));

    expect(screen.getByText("No autorizado")).toBeInTheDocument();
  });

  it("muestra fecha de publicación cuando backend reporta resultados publicados", async () => {
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: {
        votingId: "evt-1",
        votingName: "Elección de Diputados",
        institutionName: "Institución QA",
        status: "RESULTS_PUBLISHED",
        publishedAt: "2026-07-04T15:00:00.000Z",
        totalEnabled: 100,
        totalParticipated: 70,
        totalPending: 30,
        participationPercentage: 70,
      },
      isFetching: false,
      isError: false,
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "token",
      role: "ADMIN",
      active: true,
      tenantId: "tenant-1",
    });

    await userEvent.click(screen.getByRole("button", { name: "Analíticas" }));

    expect(screen.getByText("Resultados publicados")).toBeInTheDocument();
    expect(screen.getByText("Fecha publicación")).toBeInTheDocument();
    expect(screen.getAllByText("No participaron").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Pendientes")).not.toBeInTheDocument();
  });

  it("muestra No participaron para votación finalizada sin depender de resultados", async () => {
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: {
        votingId: "evt-1",
        votingName: "Elección de Diputados",
        institutionName: "Institución QA",
        status: "FINISHED",
        publishedAt: null,
        totalEnabled: 100,
        totalParticipated: 80,
        totalPending: 20,
        participationPercentage: 80,
      },
      isFetching: false,
      isError: false,
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      token: "token",
      role: "ADMIN",
      active: true,
      tenantId: "tenant-1",
    });

    await userEvent.click(screen.getByRole("button", { name: "Analíticas" }));

    expect(screen.getAllByText("No participaron").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Pendientes")).not.toBeInTheDocument();
  });
});
