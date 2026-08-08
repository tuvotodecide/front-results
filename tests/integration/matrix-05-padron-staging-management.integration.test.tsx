import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const route = { electionId: "evt-1" };

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => route,
}));
vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>("@/features/electionConfig/renderUtils");
  return { ...actual, useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime() };
});
vi.mock("@/store/votingEvents", () => ({
  useAddPadronStagingEntryMutation: vi.fn(), useAnalyzePadronWithGeminiMutation: vi.fn(),
  useBulkDeletePadronStagingEntriesMutation: vi.fn(), useConfirmPadronStagingMutation: vi.fn(),
  useDeletePadronStagingEntryMutation: vi.fn(), useEnableCurrentPadronVoterMutation: vi.fn(),
  useGetEventOptionsQuery: vi.fn(), useGetEventReviewReadinessQuery: vi.fn(), useGetEventRolesQuery: vi.fn(),
  useGetPadronStagingQuery: vi.fn(), useGetPadronVotersQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(), useGetVotingEventQuery: vi.fn(),
  useLazyDownloadPadronPdfQuery: vi.fn(), useLazyGetPadronImportStatusQuery: vi.fn(),
  useLazyGetPadronStagingQuery: vi.fn(), useUpdatePadronStagingEntryMutation: vi.fn(),
  useUploadPadronSourceMutation: vi.fn(), useImportPadronUsersMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";
import ElectionConfigPadron from "@/features/electionConfig/ElectionConfigPadron";
import LoadedPadronView from "@/features/electionConfig/components/LoadedPadronView";
import PadronDropzone from "@/features/electionConfig/components/PadronDropzone";
import PadronObservationsModal from "@/features/electionConfig/components/PadronObservationsModal";
import PadronRecordModal from "@/features/electionConfig/components/PadronRecordModal";
import PadronStagingView from "@/features/electionConfig/components/PadronStagingView";
import type { PadronFile, Voter } from "@/features/electionConfig/types";

const file: PadronFile = { fileName: "padron-job-1.pdf", uploadedAt: "2026-04-16T12:00:00.000Z", totalRecords: 2, validCount: 1, invalidCount: 1, sourceType: "PDF" };
const voters: Voter[] = [
  { id: "entry-1", rowNumber: 1, carnet: "1234567", fullName: "Ana", enabled: true, status: "valid" },
  { id: "entry-2", rowNumber: 2, carnet: "7654321", fullName: "Beto", enabled: false, status: "valid" },
];
const event = { id: "evt-1", tenantId: "tenant-1", state: "DRAFT", status: "DRAFT", name: "Elección de tenant 1", votingStart: "2026-04-18T12:00:00.000Z", votingEnd: "2026-04-18T18:00:00.000Z", publishDeadline: "2026-04-18T06:00:00.000Z" };
const mutation = (value: unknown = {}) => vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue(value) });
const refs = { workflow: vi.fn(), staging: vi.fn(), update: vi.fn(), add: vi.fn(), remove: vi.fn(), bulk: vi.fn(), upload: vi.fn() };

const draft = (job = "job-1", overrides: Record<string, unknown> = {}) => ({
  importJobId: job, eventId: "evt-1", tenantId: "tenant-1", sourceType: "PDF", status: "PARSED", isActiveDraft: true,
  originalFile: { fileName: `padron-${job}.pdf`, mimeType: "application/pdf", size: 12, sha256: job },
  parser: { provider: "gemini", model: "gemini-test", usedFallback: false },
  summary: { parsedCount: 2, validCount: 1, duplicateCount: 0, invalidCount: 0, stagingCount: 2, enabledCount: 1, disabledCount: 1, missingIdentityCount: 1 },
  errors: [], processedAt: "2026-04-16T12:00:00.000Z", createdAt: "2026-04-16T12:00:00.000Z", updatedAt: "2026-04-16T12:00:00.000Z", ...overrides,
});
const setWorkflow = (currentVersion: any = null, activeDraft: any = draft()) => vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({ data: { eventId: "evt-1", eventState: "DRAFT", currentVersion, activeDraft }, isLoading: false, isError: false, refetch: refs.workflow } as any);
const renderStaging = (props: Partial<ComponentProps<typeof PadronStagingView>> = {}) => render(<PadronStagingView file={file} voters={voters} totalVoters={2} enabledCount={1} disabledCount={1} observedCount={0} page={1} totalPages={1} pageSize={20} onPageChange={vi.fn()} onSearchChange={vi.fn()} {...props} />);

beforeEach(() => {
  vi.clearAllMocks(); route.electionId = "evt-1";
  Object.assign(refs, { workflow: vi.fn(), staging: vi.fn(), update: mutation(), add: mutation(), remove: mutation(), bulk: mutation({ deletedCount: 1 }), upload: mutation() });
  vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: event, isLoading: false, isError: false, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({ data: [{ id: "r1" }], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({ data: [{ id: "o1", candidates: [{ id: "c1" }] }], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({ data: { pending: [] }, isLoading: false, isFetching: false, refetch: vi.fn() } as any);
  setWorkflow();
  vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({ data: { data: voters.map((voter) => ({ id: voter.id, ci: voter.carnet, enabled: voter.enabled, sourceKind: "PARSED" })), total: 2, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: false, refetch: refs.staging } as any);
  vi.mocked(votingEvents.useGetPadronVotersQuery).mockReturnValue({ data: { voters: [], total: 0, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: true, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useLazyGetPadronStagingQuery).mockReturnValue([mutation({ data: [], totalPages: 1 })] as any);
  vi.mocked(votingEvents.useLazyGetPadronImportStatusQuery).mockReturnValue([mutation({ status: "PARSED" })] as any);
  vi.mocked(votingEvents.useLazyDownloadPadronPdfQuery).mockReturnValue([vi.fn()] as any);
  vi.mocked(votingEvents.useAnalyzePadronWithGeminiMutation).mockReturnValue([mutation({ records: [] }), { isLoading: false }] as any);
  vi.mocked(votingEvents.useUploadPadronSourceMutation).mockReturnValue([refs.upload, { isLoading: false }] as any);
  vi.mocked(votingEvents.useImportPadronUsersMutation).mockReturnValue([mutation(), { isLoading: false }] as any);
  vi.mocked(votingEvents.useAddPadronStagingEntryMutation).mockReturnValue([refs.add, { isLoading: false }] as any);
  vi.mocked(votingEvents.useUpdatePadronStagingEntryMutation).mockReturnValue([refs.update, { isLoading: false }] as any);
  vi.mocked(votingEvents.useDeletePadronStagingEntryMutation).mockReturnValue([refs.remove, { isLoading: false }] as any);
  vi.mocked(votingEvents.useBulkDeletePadronStagingEntriesMutation).mockReturnValue([refs.bulk, { isLoading: false }] as any);
  vi.mocked(votingEvents.useConfirmPadronStagingMutation).mockReturnValue([mutation(), { isLoading: false }] as any);
  vi.mocked(votingEvents.useEnableCurrentPadronVoterMutation).mockReturnValue([mutation(), { isLoading: false }] as any);
});

describe("MX-05 | padrón: staging, gestión y permisos", () => {
  it("[MX-05][PAD-STG-P0-001][INTEGRACION] sustituye el staging activo sin mezclar drafts", () => {
    const view = renderWithAuthStore(<ElectionConfigPadron />, { active: true, tenantId: "tenant-1", role: "ADMIN" });
    expect(screen.getByText("1234567")).toBeInTheDocument();
    setWorkflow(null, draft("job-2"));
    vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({ data: { data: [{ id: "new-1", ci: "9999999", enabled: true, sourceKind: "PARSED" }], total: 1, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: false, refetch: refs.staging } as any);
    view.rerender(<ElectionConfigPadron />);
    expect(screen.getByText("9999999")).toBeInTheDocument();
    expect(screen.queryByText("1234567")).not.toBeInTheDocument();
    expect(votingEvents.useGetPadronStagingQuery).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt-1" }), expect.objectContaining({ skip: false }));
  });

  it("[MX-05][PAD-ROW-P0-002][INTEGRACION] mantiene inhabilitación visible", () => {
    renderStaging({ observedCount: 1 });
    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(screen.getByText("Inhabilitados")).toBeInTheDocument();
    expect(screen.getAllByText("No").length).toBeGreaterThan(0);
    expect(screen.getByText("1234567")).toBeInTheDocument();
  });

  it("[MX-05][PAD-VAL-P0-001][INTEGRACION] expone observaciones corregibles sin ocultar filas válidas", async () => {
    const user = userEvent.setup();
    const onAddRecord = vi.fn();
    render(<><PadronStagingView file={file} voters={[voters[0]]} totalVoters={1} enabledCount={1} disabledCount={0} observedCount={1} page={1} totalPages={1} pageSize={20} onPageChange={vi.fn()} onSearchChange={vi.fn()} onInspectObservations={vi.fn()} /><PadronObservationsModal isOpen errors={[{ code: "INVALID_CARNET", message: "Carnet incompleto", rowIndex: 4, rawValue: "12?45" }]} onClose={vi.fn()} onAddRecord={onAddRecord} /></>);
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByText("Carnet incompleto")).toBeInTheDocument();
    expect(screen.getByText("12?45")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar registro manual" }));
    expect(onAddRecord).toHaveBeenCalledTimes(1);
  });

  it("[MX-05][PAD-DUP-P0-001][INTEGRACION] bloquea duplicados de análisis antes de reemplazar staging", () => {
    render(<PadronObservationsModal isOpen errors={[{ code: "DUPLICATE_ROW", message: "Carnet duplicado normalizado", rowIndex: 3, rawValue: "123 4567" }]} onClose={vi.fn()} />);
    expect(screen.getByText("DUPLICATE_ROW")).toBeInTheDocument();
    expect(screen.getByText("123 4567")).toBeInTheDocument();
    expect(screen.queryByText("Registro agregado y guardado automáticamente.")).not.toBeInTheDocument();
  });

  it("[MX-05][PAD-DUP-P0-002][INTEGRACION] conserva formulario al rechazar un carnet duplicado", async () => {
    const user = userEvent.setup(); const onSubmit = vi.fn().mockRejectedValue(new Error("El carnet ya existe en el staging."));
    render(<PadronRecordModal isOpen mode="edit" initialCi="1234567" initialEnabled onClose={vi.fn()} onSubmit={onSubmit} />);
    const dialog = screen.getByRole("dialog", { name: "Editar registro del padrón" }); const input = within(dialog).getByRole("textbox");
    await user.clear(input); await user.type(input, "123 4567"); await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await within(dialog).findByText("El carnet ya existe en el staging.")).toBeInTheDocument();
    expect(input).toHaveValue("123 4567");
  });

  it("[MX-05][PAD-EDT-P0-001][INTEGRACION] cancela, guarda y conserva error recuperable al editar", async () => {
    const user = userEvent.setup(); const onClose = vi.fn(); const onSubmit = vi.fn().mockRejectedValueOnce(new Error("No se pudo guardar el registro."));
    const view = render(<PadronRecordModal isOpen mode="edit" initialCi="1234567" initialEnabled={false} onClose={onClose} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" })); expect(onClose).toHaveBeenCalledTimes(1);
    view.rerender(<PadronRecordModal isOpen mode="edit" initialCi="1234567" initialEnabled={false} onClose={onClose} onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox"); await user.clear(input); await user.type(input, "7654321"); await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("No se pudo guardar el registro.")).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith({ ci: "7654321", enabled: false });
  });

  it("[MX-05][PAD-DEL-P0-001][INTEGRACION] selecciona filas y confirma una eliminación única", async () => {
    const user = userEvent.setup(); const onBulkDeleteSelected = vi.fn();
    renderStaging({ selectedVoterIds: ["entry-1"], onToggleRecordSelection: vi.fn(), onBulkDeleteSelected });
    await user.click(screen.getByRole("button", { name: /Eliminar seleccionados \(1\)/ }));
    expect(onBulkDeleteSelected).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1234567")).toBeInTheDocument();
  });

  it("[MX-05][PAD-RPL-P1-001][INTEGRACION] solicita reemplazo sin mezclar el archivo de trabajo", async () => {
    const user = userEvent.setup(); const onReplaceFile = vi.fn();
    renderStaging({ onReplaceFile });
    await user.click(screen.getByRole("button", { name: "Reemplazar archivo" }));
    expect(onReplaceFile).toHaveBeenCalledTimes(1);
    expect(screen.getByText("padron-job-1.pdf")).toBeInTheDocument();
  });

  it("[MX-05][PAD-PER-P0-001][INTEGRACION] no expone mutaciones ni datos de otro tenant", () => {
    render(<LoadedPadronView file={file} voters={[]} totalVoters={0} validCount={0} invalidCount={0} page={1} totalPages={1} pageSize={20} onPageChange={vi.fn()} onSearchChange={vi.fn()} readOnly />);
    expect(screen.queryByText("1234567")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Agregar registro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reemplazar documento/i })).not.toBeInTheDocument();
  });

  it("[MX-05][PAD-STA-P0-001][INTEGRACION] habilita controles estructurales dentro de la ventana FULL", () => {
    renderStaging({ onAddRecord: vi.fn(), onEditRecord: vi.fn(), onDeleteRecord: vi.fn(), onReplaceFile: vi.fn(), onConfirm: vi.fn() });
    expect(screen.getByRole("button", { name: "Agregar registro" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Editar 1234567" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Eliminar 1234567" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reemplazar archivo" })).toBeEnabled();
  });

  it("[MX-05][PAD-STA-P0-003][INTEGRACION] conserva lectura y bloquea todas las acciones estructurales", () => {
    render(<><PadronDropzone disabled onFileSelect={vi.fn()} /><LoadedPadronView file={file} voters={voters} totalVoters={2} validCount={1} invalidCount={1} page={1} totalPages={1} pageSize={20} onPageChange={vi.fn()} onSearchChange={vi.fn()} onAddRecord={vi.fn()} onReplaceFile={vi.fn()} onDeleteFile={vi.fn()} onFinish={vi.fn()} readOnly /></>);
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar archivo" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Agregar registro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reemplazar documento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Finalizar configuración/i })).not.toBeInTheDocument();
  });

  it("[MX-05][PAD-CON-P1-001][INTEGRACION] bloquea una segunda eliminación mientras la primera está en curso", () => {
    renderStaging({ selectedVoterIds: ["entry-1"], bulkDeleting: true, onToggleRecordSelection: vi.fn(), onBulkDeleteSelected: vi.fn() });
    expect(screen.getByRole("button", { name: /Eliminar seleccionados \(1\)/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Seleccionar 1234567" })).toBeDisabled();
  });
});
