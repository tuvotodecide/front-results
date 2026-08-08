import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import ElectionConfigPadron from "@/features/electionConfig/ElectionConfigPadron";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const createVotingEventMock = vi.fn();
const importUsersMock = vi.fn();
const route = { electionId: "evt-1" };

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => route,
}));

vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>(
    "@/features/electionConfig/renderUtils",
  );
  return { ...actual, useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime() };
});

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title ?? "Modal"}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    ) : null,
}));

vi.mock("@/store/votingEvents", () => ({
  useCreateVotingEventMutation: vi.fn(),
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
  useImportPadronUsersMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";

const activeTenantContext = {
  active: true,
  role: "TENANT_ADMIN",
  tenantId: "tenant-1",
  user: { id: "admin-1", role: "TENANT_ADMIN", active: true, tenantId: "tenant-1" } as any,
  activeContext: { type: "TENANT", role: "TENANT_ADMIN", tenantId: "tenant-1", label: "Institución" } as any,
};

function renderWizard(authState: Record<string, unknown> = activeTenantContext) {
  return renderWithAuthStore(<CreateElectionWizard />, authState as any);
}

async function fillGeneralData(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección abierta");
  await user.type(
    screen.getByLabelText("¿Cuál es el objetivo o descripción?"),
    "Elegir representantes institucionales",
  );
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

describe("votación abierta | integración con el repositorio de elecciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createVotingEventMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        id: "evt-open",
        name: "Elección abierta",
        objective: "Elegir representantes institucionales",
        isReferendum: false,
        isOpenVoting: true,
        votingStart: "2027-06-01T12:00:00.000Z",
        votingEnd: "2027-06-01T18:00:00.000Z",
        resultsPublishAt: "2027-06-01T19:00:00.000Z",
        createdAt: "2026-04-17T12:00:00.000Z",
      }),
    });
    vi.mocked(votingEvents.useCreateVotingEventMutation).mockReturnValue([
      createVotingEventMock,
      { isLoading: false },
    ] as any);
  });

  it("EA-P0-02-001 envía isOpenVoting en true junto al tenant activo a la mutación real", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    await waitFor(() => {
      expect(createVotingEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", isOpenVoting: true }),
      );
    });
  });

  it("EA-P0-02-002 envía isOpenVoting en false cuando no se activa la opción", async () => {
    const user = userEvent.setup();
    renderWizard();

    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    await waitFor(() => {
      expect(createVotingEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", isOpenVoting: false }),
      );
    });
  });

  it("EA-P0-02-003 navega a la configuración de cargos tras crear la votación abierta", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        "/votacion/elecciones/evt-open/config/cargos",
        { replace: true },
      );
    });
  });

  it("EA-P0-02-004 bloquea la creación de la votación abierta sin institución activa", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      renderWizard({ active: true, role: "TENANT_ADMIN", tenantId: null, user: null, activeContext: null });

      await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
      await fillGeneralData(user);
      await fillScheduleAndCreate(user);

      expect(
        await screen.findByText(
          "No se encontró un contexto institucional activo. Selecciona tu institución para crear votaciones.",
        ),
      ).toBeInTheDocument();
      expect(createVotingEventMock).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("EA-P0-02-005 conserva la votación abierta activada tras un error de creación", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    createVotingEventMock.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error("El nombre de la votación ya existe.")),
    });
    try {
      renderWizard();

      await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
      await fillGeneralData(user);
      await fillScheduleAndCreate(user);

      expect(await screen.findByText("El nombre de la votación ya existe.")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Anterior" }));
      expect(
        screen.getByRole("switch", { name: "¿Es votación abierta?" }),
      ).toHaveAttribute("aria-checked", "true");
    } finally {
      errorSpy.mockRestore();
    }
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
  vi.mocked(votingEvents.useImportPadronUsersMutation).mockReturnValue([importUsersMock, { isLoading: false }] as any);
}

function renderPadron() {
  return renderWithAuthStore(<ElectionConfigPadron />, activeTenantContext as any);
}

describe("votación abierta | integración de la importación automática del padrón", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    route.electionId = "evt-1";
    Object.assign(padronRefs, { workflow: vi.fn(), review: vi.fn(), staging: vi.fn(), voters: vi.fn() });
    importUsersMock.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
  });

  it("EA-P0-03-001 importa automáticamente, refresca el resumen y termina mostrando el padrón cargado", async () => {
    mockPadronHooks({ pending: ["padron"] });
    padronRefs.workflow.mockImplementation(async () => {
      vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
        data: { eventId: "evt-1", eventState: "DRAFT", currentVersion: null, activeDraft: padronDraft() },
        isLoading: false,
        isError: false,
        refetch: padronRefs.workflow,
      } as any);
    });
    padronRefs.review.mockImplementation(async () => {
      vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({
        data: { pending: [] },
        isLoading: false,
        isFetching: false,
        refetch: padronRefs.review,
      } as any);
    });

    renderPadron();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reemplazar archivo" })).toBeInTheDocument();
    });
    expect(importUsersMock).toHaveBeenCalledWith({ eventId: "evt-1" });
    expect(padronRefs.workflow).toHaveBeenCalled();
    expect(padronRefs.review).toHaveBeenCalled();
  });

  it("EA-P0-04-001 no refresca el padrón cuando la importación automática falla", async () => {
    importUsersMock.mockReturnValue({ unwrap: vi.fn().mockRejectedValue({}) });
    mockPadronHooks({ pending: ["padron"] });

    renderPadron();

    expect(
      await screen.findByText(
        "No se pudo importar automáticamente a los usuarios registrados en el padrón.",
      ),
    ).toBeInTheDocument();
    expect(padronRefs.workflow).not.toHaveBeenCalled();
    expect(padronRefs.review).not.toHaveBeenCalled();
  });
});
