import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { renderWithAuthStore } from "../utils/renderWithStore";
import ElectionsPage from "@/features/elections/ElectionsPage";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import ActiveElectionStatusPage from "@/features/electionConfig/ActiveElectionStatusPage";
import ConfirmActivateModal from "@/features/electionConfig/components/ConfirmActivateModal";
import type { UseElectionPublishReturn } from "@/features/electionConfig/data/useElectionPublish";
import type { VotingEvent, ReviewReadinessResponse } from "@/store/votingEvents/types";
import type { ConfigSummary } from "@/features/electionConfig/data/ElectionPublishRepository.mock";
import { completeReadiness, readyForReviewEvent } from "../fixtures/admin/padronPublication";

const navigateMock = vi.fn();
const refetchMock = vi.fn();
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

const useElectionPublishMock = vi.fn();

vi.mock("@/features/electionConfig/data/useElectionPublish", () => ({
  useElectionPublish: (...args: any[]) => useElectionPublishMock(...args),
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventsQuery: vi.fn(),
  useGetVotingEventQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetEventOptionsQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(),
  useGetPadronVotersQuery: vi.fn(),
  useGetPadronStagingQuery: vi.fn(),
  useGetEventResultsQuery: vi.fn(),
  useGetParticipationAnalyticsQuery: vi.fn(),
  useDownloadParticipationReportWithScreenshotMutation: vi.fn(),
  useLazyDownloadPadronPdfQuery: vi.fn(),
  useDeleteVotingEventMutation: vi.fn(),
  useDisableVotingEventMutation: vi.fn(),
  useEnableCurrentPadronVoterMutation: vi.fn(),
  useUpdateEventScheduleMutation: vi.fn(),
  useUpdateVotingEventMutation: vi.fn(),
  useCreatePresentialSessionMutation: vi.fn(),
  useCreateEventNewsMutation: vi.fn(),
}));

vi.mock("@/features/electionConfig/components/PhoneMockup", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/features/electionConfig/components/BallotPreview", () => ({
  default: () => <div data-testid="ballot-preview" />,
}));
vi.mock("@/features/electionConfig/components/ConfigSummaryCard", () => ({
  default: () => <div data-testid="config-summary" />,
}));
vi.mock("@/features/electionConfig/components/ScheduleSummaryCard", () => ({
  default: () => <div data-testid="schedule-summary" />,
}));
vi.mock("@/features/electionConfig/components/ActivatedSuccessModal", () => ({
  default: ({
    isOpen,
    title,
    description,
    shareButtonLabel,
    copyButtonLabel,
  }: {
    isOpen?: boolean;
    title?: string;
    description?: string;
    shareButtonLabel?: string;
    copyButtonLabel?: string;
  }) =>
    isOpen ? (
      <div>
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
        {shareButtonLabel ? <button type="button">{shareButtonLabel}</button> : null}
        {copyButtonLabel ? <button type="button">{copyButtonLabel}</button> : null}
      </div>
    ) : null,
}));
vi.mock("@/features/electionConfig/components/CreateNewsModal", () => ({
  default: ({ isOpen, onSubmit }: any) =>
    isOpen ? (
      <div>
        <h2>Crear noticia</h2>
        <button
          type="button"
          onClick={() =>
            void onSubmit({
              title: "Aviso operativo",
              body: "Mensaje para votantes",
              link: "https://example.com/aviso",
              imageUrl: "https://example.com/aviso.png",
            }).catch(() => undefined)
          }
        >
          Enviar noticia de prueba
        </button>
      </div>
    ) : null,
}));
vi.mock("@/features/electionConfig/components/ConfigPageFallback", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
  }) => (isOpen ? <div>{children}</div> : null),
}));

import * as votingEvents from "@/store/votingEvents";

const deleteMutation = [vi.fn(), { isLoading: false }] as const;
const disableMutation = [vi.fn(), { isLoading: false }] as const;
const noopMutation = [vi.fn(), { isLoading: false }] as const;

const makeVotingEvent = (
  overrides: Partial<VotingEvent> = {},
): VotingEvent => ({
  id: "evt-1",
  tenantId: "tenant-1",
  name: "Elección 2026",
  chainRequestId: "chain-req-1",
  objective: "Elegir directiva",
  votingStart: "2026-04-18T18:00:00.000Z",
  votingEnd: "2026-04-18T20:00:00.000Z",
  resultsPublishAt: "2026-04-18T21:00:00.000Z",
  publishDeadline: "2026-04-18T06:00:00.000Z",
  state: "READY_FOR_REVIEW",
  status: "READY_FOR_REVIEW",
  publicEligibilityEnabled: true,
  publicEligibility: true,
  presentialKioskEnabled: false,
  ...overrides,
});

const makeConfigSummary = (
  overrides: Partial<ConfigSummary> = {},
): ConfigSummary => ({
  positionsOk: true,
  partiesOk: true,
  padronOk: true,
  positionsCount: 1,
  partiesCount: 1,
  votersCount: 10,
  enabledToVoteCount: 8,
  disabledToVoteCount: 2,
  ...overrides,
});

const makeReviewReadiness = (
  overrides: Partial<ReviewReadinessResponse> = {},
): ReviewReadinessResponse => ({
  id: "evt-1",
  state: "READY_FOR_REVIEW",
  isReady: true,
  pending: [],
  publishDeadline: "2026-04-18T06:00:00.000Z",
  publicationWindow: {
    deadline: "2026-04-18T06:00:00.000Z",
    expired: false,
    canConfirmOfficialPublication: true,
    hoursUntilDeadline: 18,
  },
  ...overrides,
});

describe("publication deadlines UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    refetchMock.mockReset();

    vi.mocked(votingEvents.useDeleteVotingEventMutation).mockReturnValue(deleteMutation as any);
    vi.mocked(votingEvents.useDisableVotingEventMutation).mockReturnValue(disableMutation as any);
    vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: makeVotingEvent(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        eventState: "OFFICIALLY_PUBLISHED",
        currentVersion: null,
        activeDraft: null,
      },
      isLoading: false,
      isError: false,
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
      data: null,
      isLoading: false,
    } as any);
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: false,
    } as any);
    vi.mocked(votingEvents.useDownloadParticipationReportWithScreenshotMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useLazyDownloadPadronPdfQuery).mockReturnValue([vi.fn()] as any);
    vi.mocked(votingEvents.useEnableCurrentPadronVoterMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useUpdateEventScheduleMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useUpdateVotingEventMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useCreatePresentialSessionMutation).mockReturnValue(noopMutation as any);
    vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue(noopMutation as any);
  });

  it("shows a reminder with the real publication deadline when it is approaching", () => {
    vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
      data: [
        {
          id: "evt-reminder",
          name: "Elección 2026",
          objective: "Elegir directiva",
          status: "READY_FOR_REVIEW",
          votingStart: "2026-04-18T18:00:00.000Z",
          votingEnd: "2026-04-18T20:00:00.000Z",
          publishDeadline: "2026-04-18T06:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithAuthStore(<ElectionsPage />, {
      token: "token",
      active: true,
      role: "ADMIN",
      user: {
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin",
        role: "ADMIN",
        active: true,
        tenantId: "tenant-1",
      },
    });

    expect(screen.getByText("Publicación pendiente")).toBeInTheDocument();
    expect(
      screen.getByText(/Recuerda confirmar la publicación oficial antes del/i),
    ).toBeInTheDocument();
  });

  it("shows Caducada in the list and blocks opening the expired detail", async () => {
    const user = userEvent.setup();
    vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
      data: [
        {
          id: "evt-expired",
          name: "Elección caducada",
          objective: "Elegir directiva",
          status: "PUBLICATION_EXPIRED",
          votingStart: "2026-04-18T18:00:00.000Z",
          votingEnd: "2026-04-18T20:00:00.000Z",
          publishDeadline: "2026-04-17T06:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithAuthStore(<ElectionsPage />, {
      token: "token",
      active: true,
      role: "ADMIN",
      user: {
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin",
        role: "ADMIN",
        active: true,
        tenantId: "tenant-1",
      },
    });

    expect(screen.getByText("Caducada")).toBeInTheDocument();
    expect(
      screen.getByText(/Esta elección quedó caducada porque la ventana de publicación oficial venció/i),
    ).toBeInTheDocument();

    await user.click(screen.getByText("Elección caducada"));

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("shows an explicit reminder in review before the deadline and blocks publication once expired", () => {
    let publishHookValue: UseElectionPublishReturn = {
      votingEvent: makeVotingEvent(),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness(),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    };
    useElectionPublishMock.mockImplementation(() => publishHookValue);

    const { rerender } = render(<ElectionConfigReview />);

    expect(
      screen.getByText(/puedes modificar y confirmar la publicación oficial hasta/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/si se atrasa, la votación quedará anulada/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /confirmar publicación oficial/i }),
    ).toBeEnabled();

    publishHookValue = {
      votingEvent: makeVotingEvent({
        state: "PUBLICATION_EXPIRED",
        status: "PUBLICATION_EXPIRED",
        publishDeadline: "2026-04-17T06:00:00.000Z",
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness({
        state: "PUBLICATION_EXPIRED",
        isReady: false,
        pending: ["publication_window_expired"],
        publishDeadline: "2026-04-17T06:00:00.000Z",
        publicationWindow: {
          deadline: "2026-04-17T06:00:00.000Z",
          expired: true,
          canConfirmOfficialPublication: false,
          hoursUntilDeadline: 0,
        },
      }),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    };

    rerender(<ElectionConfigReview />);

    expect(
      screen.getAllByText(/La ventana de publicación oficial venció/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /eliminar votación vencida/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirmar publicación oficial/i }),
    ).not.toBeInTheDocument();
  });

  it("updates the post-publication padron switch from review", async () => {
    const user = userEvent.setup();
    const updateVotingEventMock = vi.fn(() => ({
      unwrap: () => Promise.resolve({}),
    }));

    vi.mocked(votingEvents.useUpdateVotingEventMutation).mockReturnValue([
      updateVotingEventMock,
      { isLoading: false },
    ] as any);

    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        allowPostPublicationPadronEnable: false,
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness(),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    expect(
      screen.getByText("Permitir habilitar votantes después de la publicación oficial"),
    ).toBeInTheDocument();

    const switches = screen.getAllByRole("switch");
    const padronSwitch = switches[switches.length - 1];
    expect(padronSwitch).toHaveAttribute("aria-checked", "false");

    await user.click(padronSwitch);

    expect(updateVotingEventMock).toHaveBeenCalledWith({
      eventId: "evt-1",
      data: { allowPostPublicationPadronEnable: true },
    });
    expect(refetchMock).toHaveBeenCalled();
  });

  it("shows a share modal after notifying voters when public padron review is enabled", async () => {
    const user = userEvent.setup();
    const openReviewMock = vi.fn(() => Promise.resolve(makeReviewReadiness()));
    const getShareUrlMock = vi.fn(() =>
      Promise.resolve("https://app.test/votacion/elecciones/evt-1/publica"),
    );

    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        state: "DRAFT",
        status: "DRAFT",
        publicEligibilityEnabled: true,
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness({ state: "DRAFT" }),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: openReviewMock,
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: getShareUrlMock,
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(screen.getByRole("button", { name: "Notificar a los votantes" }));

    expect(openReviewMock).toHaveBeenCalled();
    expect(getShareUrlMock).toHaveBeenCalled();
    expect(screen.getByText("Votantes notificados")).toBeInTheDocument();
    expect(
      screen.getByText("Comparte este enlace para que revisen su padrón."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compartir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar enlace" })).toBeInTheDocument();
  });

  it("allows notifying voters when the only pending item is disabled unregistered records", async () => {
    const user = userEvent.setup();
    const openReviewMock = vi.fn(() => Promise.resolve(makeReviewReadiness()));

    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        state: "DRAFT",
        status: "DRAFT",
        publicEligibilityEnabled: false,
        publicEligibility: false,
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 1,
      publicationPadronCount: 3,
      reviewReadiness: makeReviewReadiness({
        state: "DRAFT",
        isReady: false,
        pending: ["padron_validation"],
      }),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: openReviewMock,
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    expect(
      screen.getByText(
        "Existen 1 votantes no registrados. No recibirán notificación ni podrán votar hasta que se registren y sean habilitados.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Padrón listo para revisión")).not.toBeInTheDocument();

    const notifyButton = screen.getByRole("button", { name: "Notificar a los votantes" });
    expect(notifyButton).toBeEnabled();

    await user.click(notifyButton);

    expect(openReviewMock).toHaveBeenCalled();
  });

  it("blocks notifying voters when there are no registered enabled voters", () => {
    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        state: "DRAFT",
        status: "DRAFT",
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 2,
      publicationPadronCount: 2,
      reviewReadiness: makeReviewReadiness({
        state: "DRAFT",
        isReady: false,
        pending: ["padron_registered_enabled"],
      }),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    expect(
      screen.getByText("No hay votantes registrados y habilitados para notificar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notificar a los votantes" })).toBeDisabled();
  });

  it("opens the official publication modal when the only pending item is unregistered padron records", async () => {
    const user = userEvent.setup();
    const activateElectionMock = vi.fn();

    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent(),
      ballotPreview: null,
      configSummary: makeConfigSummary({ padronOk: false }),
      publicationMissingIdentityCount: 2,
      publicationPadronCount: 5,
      reviewReadiness: makeReviewReadiness({
        isReady: false,
        pending: ["padron_validation"],
      }),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: activateElectionMock,
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    const publishButton = screen.getByRole("button", {
      name: /confirmar publicación oficial/i,
    });
    expect(publishButton).toBeEnabled();

    await user.click(publishButton);

    expect(
      screen.getByText(
        /Existen 2 votantes no registrados. Al confirmar la publicación oficial, estos se eliminarán del padrón./i,
      ),
    ).toBeInTheDocument();
  });

  it("keeps official publication blocked by critical pending items", () => {
    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent(),
      ballotPreview: null,
      configSummary: makeConfigSummary({ padronOk: false }),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness({
        isReady: false,
        pending: ["padron"],
      }),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    expect(
      screen.getByRole("button", { name: /confirmar publicación oficial/i }),
    ).toBeDisabled();
  });

  it("confirms official publication from the review modal", async () => {
    const user = userEvent.setup();
    const activateElectionMock = vi.fn(() =>
      Promise.resolve({
        publicUrl: "https://app.test/votacion/elecciones/evt-1/publica",
        shareText: "Participa en la votación",
        electionStatus: "ACTIVE" as const,
        startsAt: "2026-04-18T18:00:00.000Z",
        nullifiers: [],
      }),
    );

    useElectionPublishMock.mockReturnValue({
      votingEvent: readyForReviewEvent,
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 10,
      reviewReadiness: completeReadiness,
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: activateElectionMock,
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(
      screen.getByRole("button", { name: /confirmar publicación oficial/i }),
    );
    await user.click(screen.getByRole("button", { name: "Publicar oficialmente" }));

    expect(activateElectionMock).toHaveBeenCalledTimes(1);
  });

  it("shows the API error when official publication fails", async () => {
    const user = userEvent.setup();
    const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
    const activateElectionMock = vi.fn(() =>
      Promise.reject({ data: { message: "La elección ya fue publicada" } }),
    );

    useElectionPublishMock.mockReturnValue({
      votingEvent: readyForReviewEvent,
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 10,
      reviewReadiness: completeReadiness,
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: activateElectionMock,
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(
      screen.getByRole("button", { name: /confirmar publicación oficial/i }),
    );
    await user.click(screen.getByRole("button", { name: "Publicar oficialmente" }));

    expect(await screen.findByText("La elección ya fue publicada")).toBeInTheDocument();
    consoleErrorMock.mockRestore();
  });

  it("shows persistent official publication request progress and blocks duplicate publication", async () => {
    const user = userEvent.setup();
    useElectionPublishMock.mockReturnValue({
      votingEvent: readyForReviewEvent,
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 10,
      reviewReadiness: completeReadiness,
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      officialPublicationRequest: {
        requestId: "opr-1",
        eventId: "evt-1",
        status: "PENDING_APPROVAL",
        expiresAt: "2026-04-18T06:00:00.000Z",
        votersCount: "10",
        requiredCredits: "10",
        requiredTvd: "10000000000000000000",
        tvdPerCredit: "1000000000000000000",
        signerWallet: "0xabc",
        createdAt: "2026-04-17T12:00:00.000Z",
        updatedAt: "2026-04-17T12:00:00.000Z",
      },
      officialPublicationMessage:
        "Esperando confirmación desde la aplicación móvil.",
      officialPublicationIsActive: true,
      officialPublicationCanCancel: true,
      officialPublicationTxUrl: null,
      cancelOfficialPublication: vi.fn(),
      cancelingOfficialPublication: false,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(screen.getByRole("button", { name: /avisos importantes/i }));

    expect(screen.getByText("Solicitud de publicación oficial")).toBeInTheDocument();
    expect(
      screen.getByText("Esperando confirmación desde la aplicación móvil."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Esperando confirmación móvil" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancelar solicitud" }),
    ).toBeEnabled();
  });

  it("shows retry action for failed retryable official publication attempts", async () => {
    const user = userEvent.setup();
    const activateElectionMock = vi.fn();
    useElectionPublishMock.mockReturnValue({
      votingEvent: readyForReviewEvent,
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 10,
      reviewReadiness: completeReadiness,
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: activateElectionMock,
      activating: false,
      activationResult: null,
      officialPublicationRequest: {
        requestId: "opr-failed",
        eventId: "evt-1",
        status: "FAILED_RETRYABLE",
        expiresAt: "2026-04-18T06:00:00.000Z",
        votersCount: "10",
        requiredCredits: "10",
        requiredTvd: "10000000000000000000",
        tvdPerCredit: "1000000000000000000",
        signerWallet: "0xabc",
        createdAt: "2026-04-17T12:00:00.000Z",
        updatedAt: "2026-04-17T12:00:00.000Z",
        errorCode: "OFFICIAL_PUBLICATION_ARTIFACT_KEY_MISSING",
        errorStage: "ARTIFACT_ENCRYPTION",
        retryable: true,
        active: false,
      },
      officialPublicationMessage:
        "No se pudo preparar la publicación oficial. Revisa la configuración del servicio e inténtalo nuevamente.",
      officialPublicationIsActive: false,
      officialPublicationCanRetry: true,
      officialPublicationCanCancel: false,
      officialPublicationTxUrl: null,
      cancelOfficialPublication: vi.fn(),
      cancelingOfficialPublication: false,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(screen.getByRole("button", { name: /avisos importantes/i }));

    expect(
      screen.getByText(
        "No se pudo preparar la publicación oficial. Revisa la configuración del servicio e inténtalo nuevamente.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Esperando confirmación móvil" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancelar solicitud" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar publicación" }),
    ).toBeEnabled();
  });

  it("cancels a safe official publication request after confirmation", async () => {
    const user = userEvent.setup();
    const cancelOfficialPublication = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    useElectionPublishMock.mockReturnValue({
      votingEvent: readyForReviewEvent,
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 10,
      reviewReadiness: completeReadiness,
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      officialPublicationRequest: {
        requestId: "opr-1",
        eventId: "evt-1",
        status: "CLAIMED",
        expiresAt: "2026-04-18T06:00:00.000Z",
        votersCount: "10",
        requiredCredits: "10",
        requiredTvd: "10000000000000000000",
        tvdPerCredit: "1000000000000000000",
        signerWallet: "0xabc",
        createdAt: "2026-04-17T12:00:00.000Z",
        updatedAt: "2026-04-17T12:00:00.000Z",
      },
      officialPublicationMessage:
        "La solicitud fue abierta en el dispositivo del administrador.",
      officialPublicationIsActive: true,
      officialPublicationCanCancel: true,
      officialPublicationTxUrl: null,
      cancelOfficialPublication,
      cancelingOfficialPublication: false,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(screen.getByRole("button", { name: /avisos importantes/i }));
    await user.click(screen.getByRole("button", { name: "Cancelar solicitud" }));

    expect(cancelOfficialPublication).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it("prevents a second official publication once the event is already published", () => {
    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        state: "OFFICIALLY_PUBLISHED",
        status: "OFFICIALLY_PUBLISHED",
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness({
        state: "OFFICIALLY_PUBLISHED",
        publicationWindow: {
          deadline: "2026-04-18T06:00:00.000Z",
          expired: false,
          canConfirmOfficialPublication: false,
          hoursUntilDeadline: 0,
        },
      }),
      loading: false,
      error: null,
      electionStatus: "ACTIVE",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    expect(
      screen.getByRole("button", { name: "Publicación oficial confirmada" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /confirmar publicación oficial/i }),
    ).not.toBeInTheDocument();
  });

  it("creates a news item from published review status with the expected payload", async () => {
    const user = userEvent.setup();
    const createEventNewsMock = vi.fn(() => ({
      unwrap: () => Promise.resolve({ imageUrl: "https://example.com/aviso.png" }),
    }));
    vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue([
      createEventNewsMock,
      { isLoading: false },
    ] as any);

    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        state: "OFFICIALLY_PUBLISHED",
        status: "OFFICIALLY_PUBLISHED",
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness({
        state: "OFFICIALLY_PUBLISHED",
      }),
      loading: false,
      error: null,
      electionStatus: "ACTIVE",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(screen.getByRole("button", { name: "Crear noticia" }));
    await user.click(screen.getByRole("button", { name: "Enviar noticia de prueba" }));

    expect(createEventNewsMock).toHaveBeenCalledWith({
      eventId: "evt-1",
      data: {
        title: "Aviso operativo",
        body: "Mensaje para votantes",
        link: "https://example.com/aviso",
        imageUrl: "https://example.com/aviso.png",
      },
    });
    expect(
      await screen.findByText("Noticia publicada correctamente con imagen."),
    ).toBeInTheDocument();
  });

  it("shows API errors when creating news from status fails", async () => {
    const user = userEvent.setup();
    const createEventNewsMock = vi.fn(() => ({
      unwrap: () => Promise.reject({ data: { message: "No se pudo guardar noticia" } }),
    }));
    vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue([
      createEventNewsMock,
      { isLoading: false },
    ] as any);

    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        state: "OFFICIALLY_PUBLISHED",
        status: "OFFICIALLY_PUBLISHED",
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness({
        state: "OFFICIALLY_PUBLISHED",
      }),
      loading: false,
      error: null,
      electionStatus: "ACTIVE",
      openReview: vi.fn(),
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: vi.fn(),
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(screen.getByRole("button", { name: "Crear noticia" }));
    await expect(
      user.click(screen.getByRole("button", { name: "Enviar noticia de prueba" })),
    ).resolves.toBeUndefined();

    expect(await screen.findByText("No se pudo guardar noticia")).toBeInTheDocument();
  });

  it("does not show the share modal after notifying voters when public padron review is disabled", async () => {
    const user = userEvent.setup();
    const openReviewMock = vi.fn(() => Promise.resolve(makeReviewReadiness()));
    const getShareUrlMock = vi.fn();

    useElectionPublishMock.mockReturnValue({
      votingEvent: makeVotingEvent({
        state: "DRAFT",
        status: "DRAFT",
        publicEligibilityEnabled: false,
        publicEligibility: false,
      }),
      ballotPreview: null,
      configSummary: makeConfigSummary(),
      publicationMissingIdentityCount: 0,
      publicationPadronCount: 0,
      reviewReadiness: makeReviewReadiness({ state: "DRAFT" }),
      loading: false,
      error: null,
      electionStatus: "DRAFT",
      openReview: openReviewMock,
      openingReview: false,
      activateElection: vi.fn(),
      activating: false,
      activationResult: null,
      copyToClipboard: vi.fn(),
      getShareUrl: getShareUrlMock,
      refetch: refetchMock,
    } satisfies UseElectionPublishReturn);

    render(<ElectionConfigReview />);

    await user.click(screen.getByRole("button", { name: "Notificar a los votantes" }));

    expect(openReviewMock).toHaveBeenCalled();
    expect(getShareUrlMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Votantes notificados")).not.toBeInTheDocument();
  });

  it("shows and copies the public election link after official publication", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: makeVotingEvent({
        state: "OFFICIALLY_PUBLISHED",
        status: "OFFICIALLY_PUBLISHED",
        publicUrl: "https://app.test/votacion/elecciones/evt-1/publica",
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      tenantId: "tenant-1",
      active: true,
      role: "ADMIN",
    });

    expect(screen.getByText("Enlace de elección para el público")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));

    expect(writeTextMock).toHaveBeenCalledWith(
      "https://app.test/votacion/elecciones/evt-1/publica",
    );
    expect(screen.getByText("Enlace copiado.")).toBeInTheDocument();
  });

  it("keeps the public link hidden before publication and preserves the QR card condition", () => {
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: makeVotingEvent({
        state: "DRAFT",
        status: "DRAFT",
        presentialKioskEnabled: true,
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      tenantId: "tenant-1",
      active: true,
      role: "ADMIN",
    });

    expect(screen.queryByText("Enlace de elección para el público")).not.toBeInTheDocument();
    expect(screen.getByText("Punto presencial")).toBeInTheDocument();
  });

  it("shows the public link together with the QR card when both correspond", () => {
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: makeVotingEvent({
        state: "OFFICIALLY_PUBLISHED",
        status: "OFFICIALLY_PUBLISHED",
        presentialKioskEnabled: true,
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      tenantId: "tenant-1",
      active: true,
      role: "ADMIN",
    });

    expect(screen.getByText("Enlace de elección para el público")).toBeInTheDocument();
    expect(screen.getByText("Punto presencial")).toBeInTheDocument();
  });

  it("shows the participation verification card in the protected status view and opens its modal", async () => {
    const user = userEvent.setup();
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: makeVotingEvent({
        state: "OFFICIALLY_PUBLISHED",
        status: "OFFICIALLY_PUBLISHED",
        presentialKioskEnabled: true,
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      tenantId: "tenant-1",
      active: true,
      role: "ADMIN",
    });

    expect(screen.getByText("Horario de Votación")).toBeInTheDocument();
    expect(screen.getByText("Estado actual")).toBeInTheDocument();
    expect(screen.getByText("Enlace de elección para el público")).toBeInTheDocument();
    expect(screen.getByText("Punto presencial")).toBeInTheDocument();
    expect(screen.getByText("Verificar participación")).toBeInTheDocument();
    expect(
      screen.getByText("Consulta si un CI ya votó en esta elección."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Verificar CI" }));

    expect(
      screen.getByText("Ingresa el CI para consultar si ya votó en esta elección."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CI")).toBeInTheDocument();
  });

  it("shows other elections in pages of three", async () => {
    const user = userEvent.setup();
    vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
      data: [
        makeVotingEvent({ id: "evt-1", name: "Actual" }),
        makeVotingEvent({ id: "evt-2", name: "Votación 2" }),
        makeVotingEvent({ id: "evt-3", name: "Votación 3" }),
        makeVotingEvent({ id: "evt-4", name: "Votación 4" }),
        makeVotingEvent({ id: "evt-5", name: "Votación 5" }),
        makeVotingEvent({ id: "evt-6", name: "Votación 6" }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithAuthStore(<ActiveElectionStatusPage />, {
      tenantId: "tenant-1",
      active: true,
      role: "ADMIN",
    });

    expect(screen.getByRole("button", { name: /Votación 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Votación 3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Votación 4/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Votación 5/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.queryByRole("button", { name: /Votación 2/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Votación 5/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Votación 6/i })).toBeInTheDocument();
  });

  it("uses a clear confirmation modal before official publication", () => {
    render(
      <ConfirmActivateModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Confirmar publicación oficial")).toBeInTheDocument();
    expect(
      screen.getByText(
        /utiliza la aplicación Tu Voto Decide en el teléfono vinculado a tu cuenta/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /la wallet institucional dispone de los TVD requeridos/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publicar oficialmente" }),
    ).toBeInTheDocument();
  });

  it("shows a visible warning in the official publication modal when there are unregistered records", () => {
    render(
      <ConfirmActivateModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isLoading={false}
        unregisteredCount={3}
      />,
    );

    expect(
      screen.getByText(
        /Existen 3 votantes no registrados. Al confirmar la publicación oficial, estos se eliminarán del padrón./i,
      ),
    ).toBeInTheDocument();
  });
});
