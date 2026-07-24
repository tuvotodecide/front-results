import { act, renderHook } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("@/store/votingEvents", () => ({
  useGetEventOptionsQuery: vi.fn(),
  useGetEventReviewReadinessQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetPadronSummaryQuery: vi.fn(),
  useGetPadronVersionsQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(),
  useGetVotingEventQuery: vi.fn(),
  useCancelOfficialPublicationRequestMutation: vi.fn(),
  useConfirmOfficialPublicationMutation: vi.fn(),
  useCreateOfficialPublicationRequestMutation: vi.fn(),
  useGetActiveOfficialPublicationRequestQuery: vi.fn(),
  useMarkEventReadyForReviewMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";
import {
  getOfficialPublicationStatusMessage,
  useElectionPublish,
} from "@/features/electionConfig/data/useElectionPublish";
import { completeReadiness } from "../fixtures/admin/padronPublication";

describe("useElectionPublish", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
    vi.mocked(votingEvents.useGetActiveOfficialPublicationRequestQuery).mockReturnValue({
      data: { request: null },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useConfirmOfficialPublicationMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreateOfficialPublicationRequestMutation).mockReturnValue([
      vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ created: true, request: null }) }),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCancelOfficialPublicationRequestMutation).mockReturnValue([
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
    expect(result.current.configSummary?.padronOk).toBe(true);
  });

  it("keeps real padron validation pending as a blocker for a current padron", () => {
    vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({
      data: { pending: ["padron_validation"] },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        currentVersion: {
          padronVersionId: "ver-1",
          createdBy: "admin-1",
          totals: { validCount: 20, invalidCount: 0, duplicateCount: 0 },
          sourceType: "PDF_IMPORT",
        },
        activeDraft: null,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    expect(result.current.configSummary?.padronOk).toBe(false);
  });

  it("exposes incomplete readiness blockers without marking the election ready", () => {
    vi.mocked(votingEvents.useGetEventReviewReadinessQuery).mockReturnValue({
      data: {
        ...completeReadiness,
        isReady: false,
        pending: ["cargos", "padron_validation"],
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        currentVersion: null,
        activeDraft: null,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    expect(result.current.reviewReadiness?.pending).toEqual([
      "cargos",
      "padron_validation",
    ]);
    expect(result.current.configSummary?.positionsOk).toBe(false);
    expect(result.current.configSummary?.padronOk).toBe(false);
  });

  it("returns the published status and confirmed padron counts after official publication", () => {
    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: {
        id: "evt-1",
        name: "Elección",
        status: "OFFICIALLY_PUBLISHED",
        state: "OFFICIALLY_PUBLISHED",
        votingStart: "2026-06-01T12:00:00.000Z",
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetPadronWorkflowSummaryQuery).mockReturnValue({
      data: {
        eventId: "evt-1",
        currentVersion: {
          padronVersionId: "ver-1",
          createdBy: "admin-1",
          totals: { validCount: 40, invalidCount: 0, duplicateCount: 0 },
          sourceType: "PDF_IMPORT",
        },
        activeDraft: null,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    expect(result.current.electionStatus).toBe("ACTIVE");
    expect(result.current.configSummary?.votersCount).toBe(40);
    expect(result.current.publicationPadronCount).toBe(0);
  });

  it("creates an official publication request without calling the legacy confirm endpoint", async () => {
    const legacyConfirm = vi.fn();
    const createRequest = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        created: true,
        request: {
          requestId: "opr-1",
          eventId: "evt-1",
          status: "PENDING_APPROVAL",
        },
      }),
    });
    const refetchOfficialPublication = vi.fn();
    vi.mocked(votingEvents.useConfirmOfficialPublicationMutation).mockReturnValue([
      legacyConfirm,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreateOfficialPublicationRequestMutation).mockReturnValue([
      createRequest,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useGetActiveOfficialPublicationRequestQuery).mockReturnValue({
      data: { request: null },
      isLoading: false,
      refetch: refetchOfficialPublication,
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    await act(async () => {
      await result.current.activateElection();
    });

    expect(createRequest).toHaveBeenCalledWith({ eventId: "evt-1" });
    expect(legacyConfirm).not.toHaveBeenCalled();
    expect(refetchOfficialPublication).toHaveBeenCalled();
  });

  it("refetches official publication state when request creation fails", async () => {
    const createRequest = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error("preparation failed")),
    });
    const refetchOfficialPublication = vi.fn();
    vi.mocked(votingEvents.useCreateOfficialPublicationRequestMutation).mockReturnValue([
      createRequest,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useGetActiveOfficialPublicationRequestQuery).mockReturnValue({
      data: {
        request: null,
        latestAttempt: {
          requestId: "opr-failed",
          eventId: "evt-1",
          status: "FAILED_RETRYABLE",
          expiresAt: null,
          votersCount: "1",
          requiredCredits: "1",
          requiredTvd: "1000000000000000000",
          tvdPerCredit: "1000000000000000000",
          signerWallet: "0xabc",
          createdAt: "2026-05-31T10:00:00.000Z",
          updatedAt: "2026-05-31T10:01:00.000Z",
          errorCode: "OFFICIAL_PUBLICATION_ARTIFACT_KEY_MISSING",
          errorStage: "ARTIFACT_ENCRYPTION",
        },
      },
      isLoading: false,
      refetch: refetchOfficialPublication,
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    await expect(
      act(async () => {
        await result.current.activateElection();
      }),
    ).rejects.toThrow("preparation failed");

    expect(createRequest).toHaveBeenCalledWith({ eventId: "evt-1" });
    expect(refetchOfficialPublication).toHaveBeenCalledTimes(1);
  });

  it("exposes active official publication request state for polling UI", () => {
    vi.mocked(votingEvents.useGetActiveOfficialPublicationRequestQuery).mockReturnValue({
      data: {
        request: {
          requestId: "opr-1",
          eventId: "evt-1",
          status: "CHAIN_PENDING",
          expiresAt: "2026-06-01T06:00:00.000Z",
          votersCount: "10",
          requiredCredits: "10",
          requiredTvd: "10000000000000000000",
          tvdPerCredit: "1000000000000000000",
          signerWallet: "0xabc",
          createdAt: "2026-05-31T10:00:00.000Z",
          updatedAt: "2026-05-31T10:01:00.000Z",
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    expect(result.current.officialPublicationIsActive).toBe(true);
    expect(result.current.officialPublicationCanCancel).toBe(false);
    expect(result.current.officialPublicationMessage).toMatch(/blockchain/i);
  });

  it("maps official publication statuses to the current admin copy", () => {
    expect(getOfficialPublicationStatusMessage("SUBMITTED")).toBe(
      "Firmado correctamente. Esperando confirmación en blockchain.",
    );
    expect(getOfficialPublicationStatusMessage("CHAIN_PENDING")).toBe(
      "Firmado correctamente. Esperando confirmación en blockchain.",
    );
    expect(getOfficialPublicationStatusMessage("CHAIN_CONFIRMED")).toBe(
      "Operación confirmada. Finalizando la publicación oficial.",
    );
    expect(getOfficialPublicationStatusMessage("FINALIZING")).toBe(
      "Operación confirmada. Finalizando la publicación oficial.",
    );
    expect(getOfficialPublicationStatusMessage("COMPLETED")).toBe(
      "La votación fue publicada oficialmente.",
    );
    expect(getOfficialPublicationStatusMessage("SUBMITTED")).not.toMatch(
      /confirmación desde la aplicación móvil/i,
    );
  });

  it("exposes failed retryable latest attempt without treating it as active", () => {
    vi.useFakeTimers();
    const refetchOfficialPublication = vi.fn();
    vi.mocked(votingEvents.useGetActiveOfficialPublicationRequestQuery).mockReturnValue({
      data: {
        request: null,
        latestAttempt: {
          requestId: "opr-failed",
          eventId: "evt-1",
          status: "FAILED_RETRYABLE",
          expiresAt: "2026-06-01T06:00:00.000Z",
          votersCount: "10",
          requiredCredits: "10",
          requiredTvd: "10000000000000000000",
          tvdPerCredit: "1000000000000000000",
          signerWallet: "0xabc",
          createdAt: "2026-05-31T10:00:00.000Z",
          updatedAt: "2026-05-31T10:01:00.000Z",
          errorCode: "OFFICIAL_PUBLICATION_ARTIFACT_KEY_MISSING",
          errorStage: "ARTIFACT_ENCRYPTION",
          retryable: true,
          active: false,
        },
      },
      isLoading: false,
      refetch: refetchOfficialPublication,
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    expect(result.current.officialPublicationRequest?.requestId).toBe("opr-failed");
    expect(result.current.officialPublicationIsActive).toBe(false);
    expect(result.current.officialPublicationCanRetry).toBe(true);
    expect(result.current.officialPublicationCanCancel).toBe(false);
    expect(result.current.officialPublicationMessage).toMatch(/volver a intentarlo/i);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(refetchOfficialPublication).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("polls active official publication requests every five seconds", () => {
    vi.useFakeTimers();
    const refetchOfficialPublication = vi.fn();
    vi.mocked(votingEvents.useGetActiveOfficialPublicationRequestQuery).mockReturnValue({
      data: {
        request: {
          requestId: "opr-1",
          eventId: "evt-1",
          status: "PENDING_APPROVAL",
          expiresAt: "2026-06-01T06:00:00.000Z",
          votersCount: "10",
          requiredCredits: "10",
          requiredTvd: "10000000000000000000",
          tvdPerCredit: "1000000000000000000",
          signerWallet: "0xabc",
          createdAt: "2026-05-31T10:00:00.000Z",
          updatedAt: "2026-05-31T10:01:00.000Z",
        },
      },
      isLoading: false,
      refetch: refetchOfficialPublication,
    } as any);

    renderHook(() => useElectionPublish("evt-1"));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(refetchOfficialPublication).toHaveBeenCalledTimes(1);
  });

  it("cancels cancelable official publication requests through the new endpoint", async () => {
    const cancelRequest = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        request: { requestId: "opr-1", eventId: "evt-1", status: "CANCELLED" },
      }),
    });
    vi.mocked(votingEvents.useCancelOfficialPublicationRequestMutation).mockReturnValue([
      cancelRequest,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useGetActiveOfficialPublicationRequestQuery).mockReturnValue({
      data: {
        request: {
          requestId: "opr-1",
          eventId: "evt-1",
          status: "PENDING_APPROVAL",
          expiresAt: "2026-06-01T06:00:00.000Z",
          votersCount: "10",
          requiredCredits: "10",
          requiredTvd: "10000000000000000000",
          tvdPerCredit: "1000000000000000000",
          signerWallet: "0xabc",
          createdAt: "2026-05-31T10:00:00.000Z",
          updatedAt: "2026-05-31T10:01:00.000Z",
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useElectionPublish("evt-1"));

    expect(result.current.officialPublicationCanCancel).toBe(true);
    await act(async () => {
      await result.current.cancelOfficialPublication();
    });

    expect(cancelRequest).toHaveBeenCalledWith({ requestId: "opr-1" });
  });
});
