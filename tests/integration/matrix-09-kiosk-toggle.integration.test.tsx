import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";

const reviewMocks = vi.hoisted(() => ({
  createPresentialSession: vi.fn(),
  updateVotingEvent: vi.fn(),
  refetch: vi.fn(),
  useElectionPublish: vi.fn(),
}));

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ electionId: "eleccion-09" }),
}));

vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>(
    "@/features/electionConfig/renderUtils",
  );

  return {
    ...actual,
    useClientNow: () => new Date("2026-01-01T00:00:00.000Z").getTime(),
  };
});

vi.mock("@/features/electionConfig/data/useElectionPublish", () => ({
  useElectionPublish: () => reviewMocks.useElectionPublish(),
}));

vi.mock("@/store/tvd", () => ({
  useGetVotingEventTvdCapacityQuery: () => ({
    data: {
      eventId: "eleccion-09",
      participantCount: 12,
      padronVersionId: "padron-09",
      tokensPerParticipant: "1",
      requiredTokens: "12",
      requiredSmallestUnit: "12000000000000000000",
      availableTokens: "24",
      availableSmallestUnit: "24000000000000000000",
      missingTokens: "0",
      missingSmallestUnit: "0",
      canPublish: true,
      reasonCode: null,
      balanceSource: "BLOCKCHAIN",
      usableBalanceField: "liquidBalanceSmallestUnit",
      walletAddress: "0x1111111111111111111111111111111111111111",
    },
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/store/votingEvents", () => ({
  useDeleteVotingEventMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateEventScheduleMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateVotingEventMutation: () => [reviewMocks.updateVotingEvent, { isLoading: false }],
  useCreatePresentialSessionMutation: () => [
    reviewMocks.createPresentialSession,
    { isLoading: false },
  ],
  useCreateEventNewsMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock("@/features/electionConfig/components/PhoneMockup", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/features/electionConfig/components/BallotPreview", () => ({
  default: () => <div />,
}));

vi.mock("@/features/electionConfig/components/ConfigSummaryCard", () => ({
  default: () => <div />,
}));

vi.mock("@/features/electionConfig/components/ScheduleSummaryCard", () => ({
  default: () => <div />,
}));

vi.mock("@/features/electionConfig/components/ActivatedSuccessModal", () => ({
  default: () => null,
}));

vi.mock("@/features/electionConfig/components/CreateNewsModal", () => ({
  default: () => null,
}));

vi.mock("@/features/electionConfig/components/ConfigPageFallback", () => ({
  default: () => null,
}));

const configureReview = (presentialKioskEnabled: boolean) => {
  reviewMocks.useElectionPublish.mockReturnValue({
    votingEvent: {
      id: "eleccion-09",
      tenantId: "tenant-09",
      name: "Elección de prueba",
      chainRequestId: "chain-09",
      objective: "Elegir directiva",
      votingStart: "2026-06-01T10:00:00.000Z",
      votingEnd: "2026-06-01T18:00:00.000Z",
      resultsPublishAt: "2026-06-01T19:00:00.000Z",
      publishDeadline: "2026-05-29T10:00:00.000Z",
      state: "DRAFT",
      status: "DRAFT",
      publicEligibilityEnabled: true,
      publicEligibility: true,
      presentialKioskEnabled,
      allowPostPublicationPadronEnable: true,
    },
    ballotPreview: null,
    configSummary: null,
    publicationMissingIdentityCount: 0,
    publicationPadronCount: 0,
    reviewReadiness: null,
    loading: false,
    openReview: vi.fn(),
    openingReview: false,
    activateElection: vi.fn(),
    activating: false,
    activationResult: null,
    getShareUrl: vi.fn(),
    copyToClipboard: vi.fn(),
    refetch: reviewMocks.refetch,
  });
};

const openAdditionalConfiguration = async () => {
  const user = userEvent.setup();
  const page = render(<ElectionConfigReview />);
  await user.click(
    screen.getByRole("button", { name: "Configuración adicional" }),
  );
  return { page, user };
};

const getPresentialKioskSection = () => {
  const section = screen
    .getByText("Usar voto presencial con QR")
    .closest("div.rounded-lg");
  if (!section) {
    throw new Error("No se encontró la sección de voto presencial con QR.");
  }
  return section;
};

describe("MX-09 | activación de voto presencial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureReview(false);
    reviewMocks.refetch.mockResolvedValue(undefined);
    reviewMocks.createPresentialSession.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    });
    reviewMocks.updateVotingEvent.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    });
  });

  it("[MX-09][KIO-HAB-P0-001][INTEGRACION] confirma activar o desactivar y conserva el estado visible ante rechazo", async () => {
    const { page, user } = await openAdditionalConfiguration();
    const switchControl = within(getPresentialKioskSection()).getByRole("switch");

    await user.click(switchControl);
    expect(reviewMocks.createPresentialSession).toHaveBeenCalledWith({
      eventId: "eleccion-09",
      data: { regenerateKioskAccessToken: false },
    });
    expect(await screen.findByText("Voto presencial activado.")).toBeInTheDocument();
    expect(switchControl).toHaveAttribute("aria-checked", "false");

    reviewMocks.createPresentialSession.mockReturnValueOnce({
      unwrap: () => Promise.reject({ data: { message: "No autorizado" } }),
    });
    await user.click(switchControl);
    expect(await screen.findByText("No autorizado")).toBeInTheDocument();
    expect(switchControl).toHaveAttribute("aria-checked", "false");

    page.unmount();
    configureReview(true);
    const { page: enabledPage, user: enabledUser } =
      await openAdditionalConfiguration();
    const enabledSwitch = within(getPresentialKioskSection()).getByRole("switch");
    await enabledUser.click(enabledSwitch);
    expect(reviewMocks.updateVotingEvent).toHaveBeenCalledWith({
      eventId: "eleccion-09",
      data: { presentialKioskEnabled: false },
    });
    expect(await screen.findByText("Voto presencial desactivado.")).toBeInTheDocument();
    enabledPage.unmount();
  });
});
