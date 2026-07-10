import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import type { ConfigSummary } from "@/features/electionConfig/data/ElectionPublishRepository.mock";
import type { UseElectionPublishReturn } from "@/features/electionConfig/data/useElectionPublish";
import type {
  ReviewReadinessResponse,
  VotingEvent,
} from "@/store/votingEvents/types";

const navigateMock = vi.fn();
const refetchMock = vi.fn();
const openReviewMock = vi.fn();
const activateElectionMock = vi.fn();
const getShareUrlMock = vi.fn();
const copyToClipboardMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ electionId: "evt-1" }),
}));

vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>(
      "@/features/electionConfig/renderUtils",
    );

  return {
    ...actual,
    useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime(),
  };
});

const useElectionPublishMock = vi.fn();

vi.mock("@/features/electionConfig/data/useElectionPublish", () => ({
  useElectionPublish: (...args: unknown[]) => useElectionPublishMock(...args),
}));

vi.mock("@/features/electionConfig/components/PhoneMockup", () => ({
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="phone-mockup">{children}</div>
  ),
}));

vi.mock("@/features/electionConfig/components/BallotPreview", () => ({
  default: ({
    parties = [],
    isReferendum,
    question,
  }: {
    parties?: Array<{ name?: string }>;
    isReferendum?: boolean;
    question?: string;
  }) => (
    <div data-testid="ballot-preview">
      <p>{isReferendum ? question || "Referéndum" : "Elige a tu candidato"}</p>
      {parties.length > 0 ? (
        parties.map((party, index) => (
          <span key={`${party.name ?? "opcion"}-${index}`}>
            {party.name ?? `Opción ${index + 1}`}
          </span>
        ))
      ) : (
        <span>No hay planchas configuradas</span>
      )}
    </div>
  ),
}));

vi.mock("@/features/electionConfig/components/ConfigSummaryCard", () => ({
  default: ({ summary }: { summary: ConfigSummary }) => (
    <div data-testid="config-summary">
      <p>Estado general</p>
      <p>Opciones configuradas: {summary.partiesCount}</p>
      <p>Padrón listo: {summary.padronOk ? "Sí" : "No"}</p>
    </div>
  ),
}));

vi.mock("@/features/electionConfig/components/ScheduleSummaryCard", () => ({
  default: () => (
    <div data-testid="schedule-summary">
      <p>Apertura</p>
      <p>Cierre</p>
      <p>Resultados</p>
    </div>
  ),
}));

vi.mock("@/features/electionConfig/components/ActivatedSuccessModal", () => ({
  default: ({
    isOpen,
    title,
    description,
    copyButtonLabel,
  }: {
    isOpen?: boolean;
    title?: string;
    description?: string;
    copyButtonLabel?: string;
  }) =>
    isOpen ? (
      <div role="dialog">
        <h2>{title || "Publicación completada"}</h2>
        {description ? <p>{description}</p> : null}
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

vi.mock("@/store/votingEvents", () => ({
  useDeleteVotingEventMutation: vi.fn(),
  useUpdateEventScheduleMutation: vi.fn(),
  useUpdateVotingEventMutation: vi.fn(),
  useCreatePresentialSessionMutation: vi.fn(),
  useCreateEventNewsMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";

const makeVotingEvent = (
  overrides: Partial<VotingEvent> = {},
): VotingEvent => ({
  id: "evt-1",
  tenantId: "tenant-1",
  name: "Elección 2026",
  chainRequestId: "chain-1",
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
  allowPostPublicationPadronEnable: true,
  ...overrides,
}) as VotingEvent;

const makeConfigSummary = (
  overrides: Partial<ConfigSummary> = {},
): ConfigSummary => ({
  positionsOk: true,
  partiesOk: true,
  padronOk: true,
  positionsCount: 1,
  partiesCount: 1,
  votersCount: 12,
  enabledToVoteCount: 10,
  disabledToVoteCount: 2,
  ...overrides,
});

const makeReadiness = (
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

const makePublishHook = (
  overrides: Partial<UseElectionPublishReturn> = {},
): UseElectionPublishReturn => ({
  votingEvent: makeVotingEvent(),
  ballotPreview: {
    electionId: "evt-1",
    electionTitle: "Elección 2026",
    electionObjective: "Elegir directiva",
    isReferendum: false,
    parties: [
      {
        id: "party-1",
        electionId: "evt-1",
        name: "Plancha Verde",
        colorHex: "#459151",
        colors: ["#459151"],
        candidates: [],
        createdAt: "2026-04-01T00:00:00.000Z",
      },
    ],
  },
  configSummary: makeConfigSummary(),
  publicationMissingIdentityCount: 0,
  publicationPadronCount: 10,
  reviewReadiness: makeReadiness(),
  loading: false,
  error: null,
  electionStatus: "DRAFT",
  openReview: openReviewMock,
  openingReview: false,
  activateElection: activateElectionMock,
  activating: false,
  activationResult: null,
  getShareUrl: getShareUrlMock,
  copyToClipboard: copyToClipboardMock,
  refetch: refetchMock,
  ...overrides,
});

const renderReview = (overrides: Partial<UseElectionPublishReturn> = {}) => {
  useElectionPublishMock.mockReturnValue(makePublishHook(overrides));
  return render(<ElectionConfigReview />);
};

describe("election config review redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    refetchMock.mockResolvedValue(undefined);
    openReviewMock.mockResolvedValue(makeReadiness());
    activateElectionMock.mockResolvedValue({
      publicUrl: "https://app.test/votacion/elecciones/evt-1/publica",
      shareText: "Participa en la votación",
      electionStatus: "ACTIVE",
      startsAt: "2026-04-18T18:00:00.000Z",
      nullifiers: [],
    });
    getShareUrlMock.mockResolvedValue(
      "https://app.test/votacion/elecciones/evt-1/publica",
    );
    copyToClipboardMock.mockResolvedValue(true);

    vi.mocked(votingEvents.useDeleteVotingEventMutation).mockReturnValue([
      vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useUpdateEventScheduleMutation).mockReturnValue([
      vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useUpdateVotingEventMutation).mockReturnValue([
      vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreatePresentialSessionMutation).mockReturnValue([
      vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreateEventNewsMutation).mockReturnValue([
      vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
      { isLoading: false },
    ] as any);
  });

  it("renderiza encabezado, estado real y acordeones principales", () => {
    renderReview();

    expect(
      screen.getByRole("heading", { name: "Revisión antes de publicar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Revisa la vista previa, horarios y configuración/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Lista para publicar").length).toBeGreaterThan(0);

    for (const section of [
      "Estado general",
      "Vista previa para votantes",
      "Horarios",
      "Avisos importantes",
      "Configuración adicional",
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(`^${section}`) }),
      ).toBeInTheDocument();
    }

    expect(screen.getByTestId("config-summary")).toHaveTextContent(
      "Opciones configuradas: 1",
    );
    expect(screen.queryByTestId("schedule-summary")).not.toBeInTheDocument();
  });

  it("permite contraer y expandir acordeones de forma accesible", async () => {
    const user = userEvent.setup();
    renderReview();

    const statusButton = screen.getByRole("button", { name: /Estado general/i });
    expect(statusButton).toHaveAttribute("aria-expanded", "true");
    expect(statusButton.querySelector("svg")).not.toBeNull();

    await user.click(statusButton);
    expect(statusButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("config-summary")).not.toBeInTheDocument();

    await user.click(statusButton);
    expect(statusButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("config-summary")).toBeInTheDocument();

    const previewButton = screen.getByRole("button", {
      name: /Vista previa para votantes/i,
    });
    expect(previewButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Horarios" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: /Avisos importantes/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Configuración adicional" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await user.click(previewButton);
    expect(previewButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByTestId("phone-mockup").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Plancha Verde").length).toBeGreaterThan(0);
  });

  it("mantiene horarios, modal actual y avisos productivos", async () => {
    const user = userEvent.setup();
    renderReview();

    await user.click(screen.getByRole("button", { name: "Horarios" }));
    const scheduleSection = screen
      .getByRole("button", { name: "Horarios" })
      .closest("section");
    expect(scheduleSection).not.toBeNull();
    expect(within(scheduleSection as HTMLElement).getByText("Apertura")).toBeInTheDocument();
    expect(within(scheduleSection as HTMLElement).getByText("Cierre")).toBeInTheDocument();
    expect(within(scheduleSection as HTMLElement).getByText("Resultados")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Modificar horarios" }));
    expect(screen.getByText("Límite para modificar y publicar oficialmente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar horarios" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(screen.getByRole("button", { name: /Avisos importantes/i }));
    expect(
      screen.getByText(/Puedes modificar y confirmar la publicación oficial hasta/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Si se atrasa, la votación quedará anulada/i),
    ).toBeInTheDocument();
  });

  it("mantiene switches reales y llama las mutations mockeadas", async () => {
    const user = userEvent.setup();
    const updateVotingEventMock = vi.fn(() => ({
      unwrap: () => Promise.resolve({}),
    }));
    const createPresentialSessionMock = vi.fn(() => ({
      unwrap: () => Promise.resolve({}),
    }));
    vi.mocked(votingEvents.useUpdateVotingEventMutation).mockReturnValue([
      updateVotingEventMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreatePresentialSessionMutation).mockReturnValue([
      createPresentialSessionMock,
      { isLoading: false },
    ] as any);

    renderReview();
    await user.click(screen.getByRole("button", { name: "Configuración adicional" }));

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);

    await user.click(switches[0]!);
    expect(createPresentialSessionMock).toHaveBeenCalledWith({
      eventId: "evt-1",
      data: { regenerateKioskAccessToken: false },
    });

    await user.click(switches[1]!);
    expect(updateVotingEventMock).toHaveBeenCalledWith({
      eventId: "evt-1",
      data: { allowPostPublicationPadronEnable: false },
    });
  });

  it("conserva acciones finales: volver, notificar y confirmar publicación", async () => {
    const user = userEvent.setup();
    const firstRender = renderReview({
      votingEvent: makeVotingEvent({ state: "DRAFT", status: "DRAFT" }),
      reviewReadiness: makeReadiness({ state: "DRAFT", isReady: true }),
    });

    await user.click(screen.getByRole("button", { name: "Volver a editar" }));
    expect(navigateMock).toHaveBeenCalledWith(
      "/votacion/elecciones/evt-1/config/cargos",
    );

    await user.click(
      screen.getByRole("button", { name: "Notificar a los votantes" }),
    );
    expect(openReviewMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Votantes notificados")).toBeInTheDocument();

    firstRender.unmount();
    renderReview();
    await user.click(
      screen.getByRole("button", { name: /Confirmar publicación oficial/i }),
    );
    expect(
      screen.getAllByText("Confirmar publicación oficial").length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("dialog", { name: "Modal" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publicar oficialmente" }));
    expect(activateElectionMock).toHaveBeenCalledTimes(1);
  });

  it("respeta estados bloqueados vencido, activo y finalizado", () => {
    const { rerender } = renderReview({
      votingEvent: makeVotingEvent({
        state: "PUBLICATION_EXPIRED",
        status: "PUBLICATION_EXPIRED",
        publishDeadline: "2026-04-17T06:00:00.000Z",
      }),
      reviewReadiness: makeReadiness({
        state: "PUBLICATION_EXPIRED",
        isReady: false,
        pending: ["publication_window_expired"],
        publicationWindow: {
          deadline: "2026-04-17T06:00:00.000Z",
          expired: true,
          canConfirmOfficialPublication: false,
          hoursUntilDeadline: 0,
        },
      }),
    });

    expect(screen.getAllByText("Ventana vencida").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Eliminar votación vencida/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Confirmar publicación oficial/i }),
    ).not.toBeInTheDocument();

    useElectionPublishMock.mockReturnValue(
      makePublishHook({
        votingEvent: makeVotingEvent({
          state: "OFFICIALLY_PUBLISHED",
          status: "OFFICIALLY_PUBLISHED",
          votingStart: "2026-04-17T10:00:00.000Z",
          votingEnd: "2026-04-17T20:00:00.000Z",
        }),
      }),
    );
    rerender(<ElectionConfigReview />);
    expect(screen.getByRole("button", { name: "La votación ya está activa" })).toBeDisabled();

    useElectionPublishMock.mockReturnValue(
      makePublishHook({
        votingEvent: makeVotingEvent({
          state: "CLOSED",
          status: "CLOSED",
          votingStart: "2026-04-16T10:00:00.000Z",
          votingEnd: "2026-04-16T20:00:00.000Z",
        }),
      }),
    );
    rerender(<ElectionConfigReview />);
    expect(screen.getByRole("button", { name: "La votación ya finalizó" })).toBeDisabled();
  });

  it("no toca entrypoints de status ni wizard de creación", async () => {
    const statusRoute = await import(
      "@/app/(votacion-private)/votacion/elecciones/[electionId]/status/page"
    );
    const createRoute = await import(
      "@/app/(votacion-private)/votacion/elecciones/new/page"
    );

    expect(statusRoute.default).toBeTypeOf("function");
    expect(createRoute.default).toBeTypeOf("function");
  });

  it("mueve el warning de votantes a Avisos importantes y no duplica badge interno", async () => {
    const user = userEvent.setup();
    renderReview({
      publicationMissingIdentityCount: 2,
      reviewReadiness: makeReadiness({
        pending: ["padron_validation"],
      }),
    });

    const statusButton = screen.getByRole("button", { name: "Estado general" });
    const statusSection = statusButton.closest("section");
    expect(statusSection).not.toBeNull();
    expect(
      within(statusSection as HTMLElement).queryByText("Lista para publicar"),
    ).not.toBeInTheDocument();
    expect(
      within(statusSection as HTMLElement).queryByText(/votantes no registrados/i),
    ).not.toBeInTheDocument();

    const warningsButton = screen.getByRole("button", {
      name: /Avisos importantes.*avisos importantes/i,
    });
    expect(warningsButton).toHaveAttribute("aria-expanded", "false");
    expect(warningsButton.querySelector("svg")).not.toBeNull();

    await user.click(warningsButton);
    expect(
      screen.getByText(/Existen 2 votantes no registrados/i),
    ).toBeInTheDocument();
  });
});
