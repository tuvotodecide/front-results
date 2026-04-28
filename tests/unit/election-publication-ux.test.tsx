import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { renderWithAuthStore } from "../utils/renderWithStore";
import ElectionsPage from "@/features/elections/ElectionsPage";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import ConfirmActivateModal from "@/features/electionConfig/components/ConfirmActivateModal";
import type { UseElectionPublishReturn } from "@/features/electionConfig/data/useElectionPublish";
import type { VotingEvent, ReviewReadinessResponse } from "@/store/votingEvents/types";
import type { ConfigSummary } from "@/features/electionConfig/data/ElectionPublishRepository.mock";

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
  useDeleteVotingEventMutation: vi.fn(),
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
  default: () => null,
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
        /esta acción publica oficialmente la elección y no podrás realizar más cambios/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar publicación" }),
    ).toBeInTheDocument();
  });
});
