import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ElectionConfigPadron from "@/features/electionConfig/ElectionConfigPadron";

const route = { electionId: "evt-1" };

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => route,
}));

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) => (isOpen ? <div>{title ? <h2>{title}</h2> : null}{children}</div> : null),
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
  useImportPadronUsersMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";

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

const draft = (missingIdentityCount: number) => ({
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
    stagingCount: 2, enabledCount: 2, disabledCount: 0, missingIdentityCount,
  },
  errors: [],
  processedAt: "2026-04-16T12:00:00.000Z",
  createdAt: "2026-04-16T12:00:00.000Z",
  updatedAt: "2026-04-16T12:00:00.000Z",
});

const asMutation = (value: unknown) => vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue(value) });

function mockPadronHooks(activeDraft: ReturnType<typeof draft>) {
  vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: baseEvent, isLoading: false, isError: false, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({ data: [], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({ data: [], isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({ data: { pending: [] }, isLoading: false, isFetching: false, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({ data: { eventId: "evt-1", eventState: "DRAFT", currentVersion: null, activeDraft }, isLoading: false, isError: false, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useGetPadronStagingQuery).mockReturnValue({ data: { data: [], total: 0, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: false, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useGetPadronVotersQuery).mockReturnValue({ data: { voters: [], total: 0, totalPages: 1 }, isFetching: false, isError: false, isUninitialized: true, refetch: vi.fn() } as any);
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
  vi.mocked(votingEvents.useImportPadronUsersMutation).mockReturnValue([asMutation({}), { isLoading: false }] as any);
}

describe("ElectionConfigPadron | aviso de identidad no verificada removido del staging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    route.electionId = "evt-1";
  });

  it("RDV-P0-01-001 no vuelve a mostrar el aviso singular de identidad no verificada aunque falte 1 registro", () => {
    mockPadronHooks(draft(1));
    render(<ElectionConfigPadron />);

    expect(
      screen.queryByText(
        "Hay 1 registro del padrón sin identidad verificada en la aplicación electoral. Se resolverá al confirmar la publicación oficial.",
      ),
    ).not.toBeInTheDocument();
  });

  it("RDV-P0-01-002 no vuelve a mostrar el aviso plural de identidad no verificada aunque falten varios registros", () => {
    mockPadronHooks(draft(3));
    render(<ElectionConfigPadron />);

    expect(
      screen.queryByText(
        "Hay 3 registros del padrón sin identidad verificada en la aplicación electoral. Se resolverán al confirmar la publicación oficial.",
      ),
    ).not.toBeInTheDocument();
  });
});
