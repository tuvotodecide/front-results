import type { ReviewReadinessResponse, VotingEvent } from "@/store/votingEvents/types";

export const padronActiveDraft = {
  importJobId: "job-padron",
  eventId: "evt-1",
  tenantId: "tenant-1",
  sourceType: "PDF",
  status: "PARSED",
  isActiveDraft: true,
  originalFile: {
    fileName: "padron.pdf",
    mimeType: "application/pdf",
    size: 10,
    sha256: "sha",
  },
  parser: { provider: "test", model: null, usedFallback: false },
  summary: {
    parsedCount: 3,
    validCount: 3,
    duplicateCount: 0,
    invalidCount: 0,
    stagingCount: 3,
    enabledCount: 3,
    disabledCount: 0,
    missingIdentityCount: 0,
  },
  errors: [],
  processedAt: "2026-04-16T12:00:00.000Z",
  createdAt: "2026-04-16T12:00:00.000Z",
  updatedAt: "2026-04-16T12:00:00.000Z",
};

export const padronStagingEntries = [
  {
    id: "entry-1",
    importJobId: "job-padron",
    ci: "1234567",
    enabled: true,
    hasIdentity: true,
    sourceKind: "PARSED",
  },
  {
    id: "entry-2",
    importJobId: "job-padron",
    ci: "7654321",
    enabled: true,
    hasIdentity: true,
    sourceKind: "PARSED",
  },
  {
    id: "entry-3",
    importJobId: "job-padron",
    ci: "1112223",
    enabled: true,
    hasIdentity: true,
    sourceKind: "PARSED",
  },
];

export const readyForReviewEvent: VotingEvent = {
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
};

export const completeReadiness: ReviewReadinessResponse = {
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
};
