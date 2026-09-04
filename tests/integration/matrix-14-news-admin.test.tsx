import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import CreateNewsModal from "@/features/electionConfig/components/CreateNewsModal";
import type { ConfigSummary } from "@/features/electionConfig/data/ElectionPublishRepository.mock";
import type { UseElectionPublishReturn } from "@/features/electionConfig/data/useElectionPublish";
import type {
  ReviewReadinessResponse,
  VotingEvent,
} from "@/store/votingEvents/types";
import { renderWithAuthStore } from "../utils/renderWithStore";

const reviewMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useElectionPublish: vi.fn(),
  deleteVotingEvent: vi.fn(),
  updateEventSchedule: vi.fn(),
  updateVotingEvent: vi.fn(),
  createPresentialSession: vi.fn(),
}));

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => reviewMocks.navigate,
  useParams: () => ({ electionId: "evt-mx14" }),
}));

vi.mock("@/features/electionConfig/data/useElectionPublish", () => ({
  useElectionPublish: (...args: unknown[]) => reviewMocks.useElectionPublish(...args),
}));

vi.mock("@/store/tvd", () => ({
  useGetVotingEventTvdCapacityQuery: () => ({
    data: {
      eventId: "evt-mx14",
      participantCount: 12,
      requiredTokens: "12",
      availableTokens: "24",
      missingTokens: "0",
      canPublish: true,
    },
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/store/votingEvents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/votingEvents")>();

  return {
    ...actual,
    useDeleteVotingEventMutation: () => [reviewMocks.deleteVotingEvent, { isLoading: false }],
    useUpdateEventScheduleMutation: () => [reviewMocks.updateEventSchedule, { isLoading: false }],
    useUpdateVotingEventMutation: () => [reviewMocks.updateVotingEvent, { isLoading: false }],
    useCreatePresentialSessionMutation: () => [reviewMocks.createPresentialSession, { isLoading: false }],
  };
});

// Estas pruebas escriben cientos de caracteres sobre pantallas grandes. El delay
// por defecto de userEvent cede al event loop en cada tecla y hace que el archivo
// roce el timeout de 5s cuando la suite corre en paralelo.
const setupUser = () => userEvent.setup({ delay: null });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type CapturedRequest = {
  pathname: string;
  method: string;
  body: unknown;
};

const makeNewsFetch = (response: Response, captured: CapturedRequest[]) =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    captured.push({
      pathname: url.pathname,
      method: request.method,
      body: request.method === "POST" ? await request.clone().json() : null,
    });
    return response;
  });

const makeVotingEvent = (
  overrides: Partial<VotingEvent> = {},
): VotingEvent => ({
  id: "evt-mx14",
  tenantId: "tenant-mx14",
  name: "Elección administrativa 2026",
  chainRequestId: "chain-mx14",
  objective: "Elegir directiva",
  votingStart: "2026-09-18T18:00:00.000Z",
  votingEnd: "2026-09-18T20:00:00.000Z",
  resultsPublishAt: "2026-09-18T21:00:00.000Z",
  publishDeadline: "2026-09-18T06:00:00.000Z",
  state: "PUBLISHED",
  status: "PUBLISHED",
  publicEligibilityEnabled: false,
  publicEligibility: false,
  presentialKioskEnabled: false,
  allowPostPublicationPadronEnable: true,
  ...overrides,
});

const makeConfigSummary = (): ConfigSummary => ({
  positionsOk: true,
  partiesOk: true,
  padronOk: true,
  positionsCount: 1,
  partiesCount: 1,
  votersCount: 12,
  enabledToVoteCount: 12,
  disabledToVoteCount: 0,
});

const makeReadiness = (): ReviewReadinessResponse => ({
  id: "evt-mx14",
  state: "PUBLISHED",
  isReady: true,
  pending: [],
  publishDeadline: "2026-09-18T06:00:00.000Z",
  publicationWindow: {
    deadline: "2026-09-18T06:00:00.000Z",
    expired: false,
    canConfirmOfficialPublication: true,
    hoursUntilDeadline: 18,
  },
});

const makePublishHook = (): UseElectionPublishReturn => ({
  votingEvent: makeVotingEvent(),
  ballotPreview: null,
  configSummary: makeConfigSummary(),
  publicationMissingIdentityCount: 0,
  publicationPadronCount: 12,
  reviewReadiness: makeReadiness(),
  electionStatus: "ACTIVE",
  loading: false,
  error: null,
  openReview: vi.fn().mockResolvedValue(makeReadiness()),
  openingReview: false,
  activateElection: vi.fn().mockResolvedValue({
    electionStatus: "ACTIVE",
    startsAt: "2026-09-18T18:00:00.000Z",
    nullifiers: [],
  }),
  activating: false,
  activationResult: null,
  getShareUrl: vi.fn().mockResolvedValue("https://admin.test/elecciones/evt-mx14"),
  copyToClipboard: vi.fn().mockResolvedValue(true),
  refetch: vi.fn().mockResolvedValue(undefined),
});

const renderReview = () => {
  reviewMocks.useElectionPublish.mockReturnValue(makePublishHook());
  return renderWithAuthStore(<ElectionConfigReview />, {
    token: "admin-mx14-token",
    role: "ADMIN",
    active: true,
  });
};

const openNewsModal = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Crear noticia" }));
  return screen.findByRole("dialog", { name: "Crear noticia" });
};

const fillNewsForm = async (
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
) => {
  await user.type(within(dialog).getByLabelText("Título"), "Horario actualizado");
  await user.type(
    within(dialog).getByLabelText("Descripción"),
    "La mesa atenderá hasta las 19:00.",
  );
  await user.type(
    within(dialog).getByLabelText("Enlace opcional"),
    "https://admin.test/horarios",
  );
  await user.type(
    within(dialog).getByLabelText("URL de imagen (opcional)"),
    "https://cdn.test/horarios.png",
  );
};

const renderNewsModal = (options?: {
  isLoading?: boolean;
  onClose?: () => void;
  onSubmit?: (payload: {
    title: string;
    body: string;
    link?: string;
    imageUrl?: string;
  }) => Promise<void>;
}) => {
  const onClose = options?.onClose ?? vi.fn();
  const onSubmit = options?.onSubmit ?? vi.fn().mockResolvedValue(undefined);

  render(
    <CreateNewsModal
      isOpen
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={options?.isLoading}
    />,
  );

  return { onClose, onSubmit };
};

const fillModalRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Título"), "Aviso de horario");
  await user.type(
    screen.getByLabelText("Descripción"),
    "La atención al votante cambia esta semana.",
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  reviewMocks.deleteVotingEvent.mockReturnValue({ unwrap: vi.fn() });
  reviewMocks.updateEventSchedule.mockReturnValue({ unwrap: vi.fn() });
  reviewMocks.updateVotingEvent.mockReturnValue({ unwrap: vi.fn() });
  reviewMocks.createPresentialSession.mockReturnValue({ unwrap: vi.fn() });
});

describe("MX-14 | publicación administrativa de noticias", () => {
  it("[MX-14][NOT-ADM-P1-001][INTEGRACION] valida el modal y publica desde la pantalla administrativa mediante el endpoint real", async () => {
    const modalUser = setupUser();
    const { onSubmit: standaloneSubmit } = renderNewsModal();
    const standalonePublish = screen.getByRole("button", { name: "Publicar noticia" });
    const standaloneDialog = screen.getByRole("dialog", { name: "Crear noticia" });
    const standaloneLink = within(standaloneDialog).getByRole("textbox", { name: /^Enlace opcional/i });
    const standaloneImage = within(standaloneDialog).getByRole("textbox", { name: /^URL de imagen \(opcional\)/i });

    expect(standalonePublish).toBeDisabled();
    await fillModalRequiredFields(modalUser);
    await modalUser.type(standaloneLink, "ftp://admin.test/horarios");
    await modalUser.click(standalonePublish);
    expect(standaloneSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Ingresa un enlace válido que comience con http:// o https://.")).toBeInTheDocument();
    await modalUser.clear(standaloneLink);
    await modalUser.type(standaloneLink, "https://admin.test/horarios");
    await modalUser.type(standaloneImage, "ftp://cdn.test/horarios.webp");
    await modalUser.click(standalonePublish);
    expect(standaloneSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Ingresa una URL http(s) que apunte a una imagen válida, por ejemplo .png, .jpg o .webp.")).toBeInTheDocument();
    cleanup();
    renderNewsModal({ isLoading: true });
    expect(screen.getByRole("button", { name: "Publicando..." })).toBeDisabled();

    const user = setupUser();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal(
      "fetch",
      makeNewsFetch(
        jsonResponse({
          id: "news-mx14-1",
          eventId: "evt-mx14",
          title: "Horario actualizado",
          body: "La mesa atenderá hasta las 19:00.",
          link: "https://admin.test/horarios",
          imageUrl: "https://cdn.test/horarios.png",
          sent: 12,
          skipped: 0,
        }),
        captured,
      ),
    );

    cleanup();
    renderReview();
    const dialog = await openNewsModal(user);
    await fillNewsForm(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Publicar noticia" }));

    await waitFor(() => {
      expect(captured).toEqual([
        {
          pathname: "/api/v1/voting/events/evt-mx14/news",
          method: "POST",
          body: {
            title: "Horario actualizado",
            body: "La mesa atenderá hasta las 19:00.",
            link: "https://admin.test/horarios",
            imageUrl: "https://cdn.test/horarios.png",
          },
        },
      ]);
    });
    expect(screen.queryByRole("dialog", { name: "Crear noticia" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Noticia publicada correctamente con imagen."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/12 enviad[oa]s/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 omitid[oa]s/i)).not.toBeInTheDocument();
  }, 15000);

  it("[MX-14][NOT-ADM-P1-002][INTEGRACION] conserva campos editables ante validación inválida y rechazo backend con un único envío", async () => {
    const modalUser = setupUser();
    const { onSubmit: standaloneSubmit } = renderNewsModal();
    await fillModalRequiredFields(modalUser);
    const standaloneLink = screen.getByLabelText("Enlace opcional");
    const standaloneImage = screen.getByLabelText("URL de imagen (opcional)");
    await modalUser.type(standaloneLink, "ftp://admin.test/horarios");
    await modalUser.type(standaloneImage, "https://cdn.test/horarios.pdf");
    await modalUser.click(screen.getByRole("button", { name: "Publicar noticia" }));
    expect(screen.getByText("Ingresa un enlace válido que comience con http:// o https://.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa una URL http(s) que apunte a una imagen válida, por ejemplo .png, .jpg o .webp.")).toBeInTheDocument();
    expect(standaloneLink).toBeEnabled();
    expect(standaloneImage).toBeEnabled();
    expect(standaloneSubmit).not.toHaveBeenCalled();

    const user = setupUser();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal(
      "fetch",
      makeNewsFetch(
        jsonResponse({ message: "La publicación fue rechazada por el servidor." }, 422),
        captured,
      ),
    );

    cleanup();
    renderReview();
    const dialog = await openNewsModal(user);
    await fillNewsForm(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Publicar noticia" }));

    expect(
      await screen.findAllByText("La publicación fue rechazada por el servidor."),
    ).not.toHaveLength(0);
    const openDialog = screen.getByRole("dialog", { name: "Crear noticia" });
    expect(within(openDialog).getByLabelText("Título")).toHaveValue("Horario actualizado");
    expect(within(openDialog).getByLabelText("Descripción")).toHaveValue(
      "La mesa atenderá hasta las 19:00.",
    );
    expect(within(openDialog).getByLabelText("Enlace opcional")).toHaveValue(
      "https://admin.test/horarios",
    );
    expect(within(openDialog).getByLabelText("URL de imagen (opcional)")).toHaveValue(
      "https://cdn.test/horarios.png",
    );
    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual({
      pathname: "/api/v1/voting/events/evt-mx14/news",
      method: "POST",
      body: {
        title: "Horario actualizado",
        body: "La mesa atenderá hasta las 19:00.",
        link: "https://admin.test/horarios",
        imageUrl: "https://cdn.test/horarios.png",
      },
    });
  }, 15000);

  it("[MX-14][NOT-SEC-P0-002][INTEGRACION] muestra solo datos de la noticia y excluye tokens, secretos y cabeceras del DOM", async () => {
    const user = setupUser();
    const { onSubmit } = renderNewsModal();

    await fillModalRequiredFields(user);
    await user.type(screen.getByLabelText("Enlace opcional"), "https://admin.test/horarios");
    await user.type(screen.getByLabelText("URL de imagen (opcional)"), "https://cdn.test/horarios.png");

    expect(screen.getByRole("heading", { name: "Crear noticia" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Aviso de horario");
    expect(screen.getByLabelText("Descripción")).toHaveValue("La atención al votante cambia esta semana.");
    expect(screen.getByLabelText("Enlace opcional")).toHaveValue("https://admin.test/horarios");
    expect(screen.getByLabelText("URL de imagen (opcional)")).toHaveValue("https://cdn.test/horarios.png");
    expect(document.body).not.toHaveTextContent(/token fcm|x-api-key|authorization|private key|firebase|secret/i);

    await user.click(screen.getByRole("button", { name: "Publicar noticia" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Aviso de horario",
        body: "La atención al votante cambia esta semana.",
        link: "https://admin.test/horarios",
        imageUrl: "https://cdn.test/horarios.png",
      });
    });
  });
});
