import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/store/votingEvents", () => ({
  useGetEventOptionsQuery: vi.fn(),
  useGetEventReviewReadinessQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetPadronSummaryQuery: vi.fn(),
  useGetPadronVersionsQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(),
  useGetVotingEventQuery: vi.fn(),
  useConfirmOfficialPublicationMutation: vi.fn(),
  useMarkEventReadyForReviewMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";
import { useElectionPublish } from "@/features/electionConfig/data/useElectionPublish";

describe("useElectionPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: {
        id: "evt-1",
        name: "Elección",
        status: "DRAFT",
        state: "DRAFT",
        votingStart: "2026-06-01T12:00:00.000Z",
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({
      data: [{ id: "role-1", name: "Presidencia" }],
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({
      data: [{ id: "opt-1", name: "Lista Azul", candidates: [{ id: "cand-1", roleName: "Presidencia", name: "Ana" }] }],
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronVersionsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronSummaryQuery).mockReturnValue({
      data: { total: 0, enabledToVote: 0, disabledToVote: 0 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({
      data: { pending: [] },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useConfirmOfficialPublicationMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useMarkEventReadyForReviewMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
  });

  it("uses the active draft as the pre-publication source of truth", () => {
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        currentVersion: {
          padronVersionId: "ver-1",
          createdBy: "admin-1",
          totals: { validCount: 20, invalidCount: 0, duplicateCount: 0 },
          sourceType: "PDF_IMPORT",
        },
        activeDraft: {
          importJobId: "job-1",
          eventId: "evt-1",
          tenantId: "tenant-1",
          sourceType: "PDF",
          status: "PARSED",
          isActiveDraft: true,
          originalFile: { fileName: "padron.pdf", mimeType: "application/pdf", size: 10, sha256: "sha" },
          parser: { provider: "test", model: null, usedFallback: false },
          summary: {
            parsedCount: 10,
            validCount: 10,
            duplicateCount: 0,
            invalidCount: 0,
            stagingCount: 10,
            enabledCount: 10,
            disabledCount: 0,
            missingIdentityCount: 1,
          },
          errors: [],
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    expect(result.current.configSummary?.votersCount).toBe(10);
    expect(result.current.configSummary?.padronOk).toBe(false);
  });
});
