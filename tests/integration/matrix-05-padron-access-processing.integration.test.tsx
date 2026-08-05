import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();
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

import * as votingEvents from "@/store/votingEvents";
import ElectionConfigPadron from "@/features/electionConfig/ElectionConfigPadron";

const baseEvent = {
  id: "evt-1",
  tenantId: "tenant-1",
  state: "DRAFT",
  status: "DRAFT",
  name: "Elección institucional",
  objective: "Elegir directiva",
  votingStart: "2026-04-18T12:00:00.000Z",
  votingEnd: "2026-04-18T18:00:00.000Z",
  resultsPublishAt: "2026-04-19T12:00:00.000Z",
  publishDeadline: "2026-04-18T06:00:00.000Z",
};

const importedRecord = {
  id: "gemini-1",
  carnet: "1234567",
  enabled: true,
  sourceKind: "PARSED" as const,
  sourceRow: 1,
  updatedAt: null,
};

const activeDraft = (status = "PARSED", overrides: Record<string, unknown> = {}) => ({
  importJobId: "job-1",
  eventId: "evt-1",
  tenantId: "tenant-1",
  sourceType: "PDF",
  status,
  isActiveDraft: true,
  originalFile: { fileName: "padron-evt-1.pdf", mimeType: "application/pdf", size: 14, sha256: "sha-1" },
  parser: { provider: "gemini", model: "gemini-test", usedFallback: false },
  summary: {
    parsedCount: 12,
    validCount: 8,
    duplicateCount: 1,
    invalidCount: 1,
    stagingCount: 10,
    enabledCount: 8,
    disabledCount: 2,
    missingIdentityCount: 0,
  },
  errors: [],
  processedAt: "2026-04-16T12:00:00.000Z",
  createdAt: "2026-04-16T12:00:00.000Z",
  updatedAt: "2026-04-16T12:00:00.000Z",
  ...overrides,
});

const asMutation = (value: unknown) => vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue(value) });
const asRejectedMutation = (value: unknown) => vi.fn().mockReturnValue({ unwrap: vi.fn().mockRejectedValue(value) });

const refs = {
  workflow: vi.fn(),
  review: vi.fn(),
  staging: vi.fn(),
  voters: vi.fn(),
  stagingPage: vi.fn(),
  importStatus: vi.fn(),
  analyze: vi.fn(),
  upload: vi.fn(),
  add: vi.fn(),
};

const setWorkflow = (currentVersion: any = null, draft: any = null) => {
  vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
    data: { eventId: "evt-1", eventState: "DRAFT", currentVersion, activeDraft: draft },
    isLoading: false,
    isError: false,
    refetch: refs.workflow,
  } as any);
};

const renderPage = () =>
  renderWithAuthStore(<ElectionConfigPadron />, { tenantId: "tenant-1", active: true, role: "ADMIN" });

const selectPdf = () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (!input) throw new Error("No se encontró el selector productivo del padrón.");
  fireEvent.change(input, {
    target: { files: [new File(["%PDF-1.4"], "padron.pdf", { type: "application/pdf" })] },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  route.electionId = "evt-1";
  Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
  Object.assign(refs, {
    workflow: vi.fn(), review: vi.fn(), staging: vi.fn(), voters: vi.fn(), stagingPage: vi.fn(), importStatus: vi.fn(),
    analyze: vi.fn(), upload: vi.fn(), add: vi.fn(),
  });
  vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
    data: baseEvent, isLoading: false, isError: false, refetch: vi.fn(),
  } as any);
  vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({ data: [{ id: "role-1", name: "Presidencia" }], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({ data: [{ id: "opt-1", candidates: [{ id: "candidate-1" }] }], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({ data: { pending: [] }, isLoading: false, isFetching: false, refetch: refs.review } as any);
  setWorkflow();
  vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({ data: { data: [], total: 0, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: true, refetch: refs.staging } as any);
  vi.mocked(votingEvents.useGetPadronVotersQuery).mockReturnValue({ data: { voters: [], total: 0, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: true, refetch: refs.voters } as any);
  refs.stagingPage.mockReturnValue({
    unwrap: vi.fn().mockResolvedValue({ data: [], page: 1, totalPages: 1 }),
  });
  vi.mocked(votingEvents.useLazyGetPadronStagingQuery).mockReturnValue([refs.stagingPage] as any);
  vi.mocked(votingEvents.useLazyDownloadPadronPdfQuery).mockReturnValue([vi.fn()] as any);
  vi.mocked(votingEvents.useLazyGetPadronImportStatusQuery).mockReturnValue([refs.importStatus] as any);
  vi.mocked(votingEvents.useAnalyzePadronWithGeminiMutation).mockReturnValue([refs.analyze, { isLoading: false }] as any);
  vi.mocked(votingEvents.useUploadPadronSourceMutation).mockReturnValue([refs.upload, { isLoading: false }] as any);
  vi.mocked(votingEvents.useAddPadronStagingEntryMutation).mockReturnValue([refs.add, { isLoading: false }] as any);
  vi.mocked(votingEvents.useUpdatePadronStagingEntryMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
  vi.mocked(votingEvents.useDeletePadronStagingEntryMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
  vi.mocked(votingEvents.useBulkDeletePadronStagingEntriesMutation).mockReturnValue([asMutation({ deletedCount: 1 }), { isLoading: false }] as any);
  vi.mocked(votingEvents.useConfirmPadronStagingMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
  vi.mocked(votingEvents.useEnableCurrentPadronVoterMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
  refs.analyze.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ fileName: "padron.pdf", uploadedAt: "2026-04-16T12:00:00.000Z", sourceType: "PDF_GEMINI", analysisProvider: "GEMINI_CLIENT", model: "gemini-test", records: [importedRecord], observations: [] }) });
  refs.upload.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ importJobId: "job-upload", status: "PARSED", summary: { stagingCount: 1, enabledCount: 1, disabledCount: 0, invalidCount: 0, duplicateCount: 0 } }) });
  refs.add.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ id: "staging-new" }) });
  refs.importStatus.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ importJobId: "job-upload", status: "PARSED", summary: { stagingCount: 1 }, errors: [] }) });
});

afterEach(() => vi.useRealTimers());

describe("MX-05 | padrón: acceso, carga y procesamiento", () => {
  it("[MX-05][PAD-ACC-P0-001][INTEGRACION] controla acceso, carga, error recuperable e identificadores inválidos", () => {
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as any);
    const view = renderPage();
    expect(screen.getByText("Cargando configuración del padrón...")).toBeInTheDocument();

    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: baseEvent, isLoading: false, isError: false, refetch: vi.fn() } as any);
    setWorkflow(null, activeDraft());
    view.rerender(<ElectionConfigPadron />);
    expect(screen.getByText("Elección institucional")).toBeInTheDocument();
    expect(votingEvents.useGetPadronWorkflowSummaryQuery).toHaveBeenCalledWith("evt-1", expect.objectContaining({ skip: false }));
    expect(votingEvents.useGetPadronStagingQuery).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt-1" }), expect.objectContaining({ skip: false }));

    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() } as any);
    view.rerender(<ElectionConfigPadron />);
    expect(screen.getByText("No se pudo cargar el padrón")).toBeInTheDocument();
    route.electionId = "";
    view.rerender(<ElectionConfigPadron />);
    expect(screen.getByText("ID de votación no válido")).toBeInTheDocument();
    expect(baseEvent.tenantId).toBe("tenant-1");
  });

  it("[MX-05][PAD-LST-P0-001][INTEGRACION] muestra el padrón vigente aislado, buscable y paginado", async () => {
    const user = userEvent.setup();
    setWorkflow({ padronVersionId: "version-evt-1", createdAt: "2026-04-16T12:00:00.000Z", totals: { validCount: 10, invalidCount: 2 }, sourceType: "PDF_IMPORT" });
    vi.mocked(votingEvents.useGetPadronVotersQuery).mockReturnValue({ data: { voters: [{ id: "v1", carnetNorm: "1234567", fullName: "Ana", enabled: true }, { id: "v2", carnetNorm: "7654321", fullName: "Beto", enabled: false }], total: 12, totalPages: 2 }, isFetching: false, isError: false, isUninitialized: false, refetch: refs.voters } as any);
    renderPage();
    expect(screen.getByText("Total Registros")).toBeInTheDocument();
    expect(screen.getByText("Válidos")).toBeInTheDocument();
    expect(screen.getByText("Inválidos")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    const search = screen.getByPlaceholderText("Buscar por carnet");
    await user.type(search, "7654321");
    fireEvent.submit(search.closest("form")!);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(votingEvents.useGetPadronVotersQuery).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt-1", page: 2 }), expect.any(Object));
  });

  it("[MX-05][PAD-LST-P1-002][INTEGRACION] muestra staging activo, totales, selección, búsqueda y paginación", async () => {
    const user = userEvent.setup();
    setWorkflow(null, activeDraft());
    vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({ data: { data: [{ id: "s1", ci: "1234567", enabled: true, hasIdentity: true, sourceKind: "PARSED" }, { id: "s2", ci: "7654321", enabled: false, hasIdentity: false, sourceKind: "PARSED" }], total: 10, totalPages: 2 }, isFetching: false, isError: false, isUninitialized: false, refetch: refs.staging } as any);
    renderPage();
    expect(screen.getByText("Habilitados")).toBeInTheDocument();
    expect(screen.getByText("Inhabilitados")).toBeInTheDocument();
    expect(screen.getByText("Observados")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar 1234567" }));
    const search = screen.getByPlaceholderText("Buscar por carnet");
    await user.type(search, "7654321");
    fireEvent.submit(search.closest("form")!);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(votingEvents.useGetPadronStagingQuery).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt-1", page: 2 }), expect.any(Object));
  });

  it("[MX-05][PAD-UPL-P0-001][INTEGRACION] acepta archivo permitido y bloquea extensión ajena antes del análisis", async () => {
    setWorkflow();
    renderPage();
    const dropzone = screen.getByText("Arrastra aquí el archivo del padrón electoral").closest("div");
    if (!dropzone) throw new Error("No se encontró el dropzone productivo.");
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(["x"], "padron.txt", { type: "text/plain" })] } });
    expect(refs.analyze).not.toHaveBeenCalled();
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(["%PDF"], "padron.pdf", { type: "application/pdf" })] } });
    await waitFor(() => expect(refs.analyze).toHaveBeenCalledTimes(1));
    expect(refs.upload).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Elección institucional")).toBeInTheDocument();
  });

  it("[MX-05][PAD-FIL-P0-001][INTEGRACION] conserva contexto ante archivo rechazado por el backend sin staging falso", async () => {
    setWorkflow();
    refs.upload.mockImplementation(asRejectedMutation({ data: { message: "Archivo corrupto o no soportado" } }));
    renderPage();
    selectPdf();
    expect(await screen.findByText("Archivo corrupto o no soportado")).toBeInTheDocument();
    expect(refs.add).not.toHaveBeenCalled();
    expect(screen.getByText("Elección institucional")).toBeInTheDocument();
    expect(screen.getByText("Arrastra aquí el archivo del padrón electoral")).toBeInTheDocument();
  });

  it("[MX-05][PAD-PRC-P0-001][INTEGRACION] permite informativas y bloquea observaciones o resultados sin registros", async () => {
    setWorkflow();
    refs.analyze.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ fileName: "padron.pdf", uploadedAt: "2026-04-16T12:00:00.000Z", sourceType: "PDF_GEMINI", analysisProvider: "GEMINI_CLIENT", model: "gemini", records: [importedRecord], observations: [{ code: "GEMINI_OBSERVATION", message: "Encabezado omitido", rowIndex: null, rawValue: null }] }) });
    const first = renderPage();
    selectPdf();
    expect(await screen.findByText(/Se cargaron los registros detectados/i)).toBeInTheDocument();
    expect(refs.upload).toHaveBeenCalledTimes(1);
    first.unmount();

    refs.upload.mockClear();
    refs.analyze.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ fileName: "padron.pdf", uploadedAt: "2026-04-16T12:00:00.000Z", sourceType: "PDF_GEMINI", analysisProvider: "GEMINI_CLIENT", model: "gemini", records: [importedRecord], observations: [{ code: "GEMINI_OBSERVATION", message: "Fila incompleta que requiere revisión", rowIndex: 2, rawValue: "12?" }] }) });
    const second = renderPage();
    selectPdf();
    expect(await screen.findByText("Registros por revisar")).toBeInTheDocument();
    expect(refs.upload).not.toHaveBeenCalled();
    second.unmount();

    refs.analyze.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ fileName: "padron.pdf", uploadedAt: "2026-04-16T12:00:00.000Z", sourceType: "PDF_GEMINI", analysisProvider: "GEMINI_CLIENT", model: "gemini", records: [], observations: [] }) });
    renderPage();
    selectPdf();
    expect(await screen.findByText(/No se pudieron detectar registros utilizables/i)).toBeInTheDocument();
    expect(refs.add).toHaveBeenCalledTimes(1);
  });

  it("[MX-05][PAD-PRC-P0-002][INTEGRACION] procesa import job, materializa staging y refresca el resumen", async () => {
    setWorkflow();
    renderPage();
    selectPdf();
    await waitFor(() => expect(refs.add).toHaveBeenCalledWith({ eventId: "evt-1", ci: "1234567", enabled: true, deferMaterialization: true }));
    expect(refs.upload).toHaveBeenCalledTimes(1);
    expect(refs.workflow).toHaveBeenCalled();
    expect(refs.review).toHaveBeenCalled();
    expect(refs.staging).not.toHaveBeenCalled();
  });

  it("[MX-05][PAD-PRC-P0-003][INTEGRACION] hace polling de PROCESSING y conserva un único resultado tras el parseo", async () => {
    vi.useFakeTimers();
    setWorkflow();
    refs.upload.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ importJobId: "job-upload", status: "PROCESSING" }) });
    refs.importStatus
      .mockReturnValueOnce({ unwrap: vi.fn().mockResolvedValue({ importJobId: "job-upload", status: "PROCESSING" }) })
      .mockReturnValueOnce({ unwrap: vi.fn().mockResolvedValue({ importJobId: "job-upload", status: "PARSED", summary: { stagingCount: 1 }, errors: [] }) });
    renderPage();
    await act(async () => {
      selectPdf();
      await Promise.resolve();
    });
    expect(screen.getByText("Analizando archivo del padrón...")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(refs.importStatus).toHaveBeenCalledTimes(2);
    expect(refs.workflow).toHaveBeenCalled();
    expect(refs.add).toHaveBeenCalledTimes(1);
  });
});
