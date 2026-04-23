// Tipos para Institutional Voting Events

export interface CreateVotingEventDto {
  tenantId: string;
  name: string;
  objective: string;
  isReferendum?: boolean;
  votingStart?: string;
  votingEnd?: string;
  resultsPublishAt?: string;
}

export interface UpdateVotingEventDto {
  name?: string;
  objective?: string;
  presentialKioskEnabled?: boolean;
}

export interface CreateEventRoleDto {
  name: string;
  maxWinners?: number;
}

export interface UpdateEventRoleDto {
  name?: string;
  maxWinners?: number;
}

export interface CreateCandidateDto {
  name: string;
  photoUrl?: string;
  roleName: string;
}

export interface CreateVotingOptionDto {
  name: string;
  color: string;
  colors?: string[];
  logoUrl?: string;
  candidates?: CreateCandidateDto[];
}

export interface UpdateVotingOptionDto {
  name?: string;
  color?: string;
  colors?: string[];
  logoUrl?: string;
}

export interface ReplaceCandidatesDto {
  candidates: CreateCandidateDto[];
}

export interface UpdateScheduleDto {
  votingStart?: string;
  votingEnd?: string;
  resultsPublishAt?: string;
}

export interface UpdatePublicEligibilityDto {
  enabled: boolean;
}

export interface SnapshotRoleDto {
  roleName: string;
  total: number;
  ranking: RankingItem[];
  winners: string[];
}

export interface RankingItem {
  optionId: string;
  optionName: string;
  votes: number;
  percentage: number;
}

export interface UpsertEventResultsSnapshotDto {
  txHash?: string;
  blockNumber?: string;
  roles: SnapshotRoleDto[];
}

export interface CreateParticipationDto {
  carnet: string;
  presentialSessionId?: string;
}

export interface CreatePresentialSessionDto {
  stationId?: string;
  regenerateKioskAccessToken?: boolean;
  readyTtlSeconds?: number;
  claimTtlSeconds?: number;
}

export interface CreateEventNewsDto {
  title: string;
  body: string;
  imageUrl?: string;
  link?: string;
}

export type VotingEventStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "PUBLISHED"
  | "OFFICIALLY_PUBLISHED"
  | "PUBLICATION_EXPIRED"
  | "ACTIVE"
  | "CLOSED"
  | "RESULTS_PUBLISHED";

export interface VotingEvent {
  id: string;
  tenantId: string;
  name: string;
  chainRequestId: string;
  objective: string;
  isReferendum?: boolean;
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsPublishAt?: string | null;
  publishDeadline?: string | null;
  state: VotingEventStatus;
  status: VotingEventStatus;
  publicEligibilityEnabled: boolean;
  publicEligibility: boolean;
  canEditPadronInLimitedMode?: boolean;
  presentialKioskEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  roles?: EventRole[];
  options?: VotingOption[];
}

export interface EventRole {
  id: string;
  eventId: string;
  name: string;
  maxWinners: number;
  createdAt?: string;
}

export interface OptionCandidate {
  id: string;
  optionId?: string;
  name: string;
  photoUrl?: string;
  roleName: string;
}

export interface VotingOption {
  id: string;
  eventId: string;
  name: string;
  color: string;
  colors?: string[];
  logoUrl?: string;
  active: boolean;
  candidates: OptionCandidate[];
  createdAt?: string;
}

export interface PadronVersion {
  id: string;
  padronVersionId: string;
  eventId?: string;
  fileDigest: string;
  fileName: string;
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  uploadedAt: string;
  createdAt: string;
  createdBy?: string;
  isCurrent: boolean;
  sourceType?: "CSV_LEGACY" | "PDF_IMPORT" | "IMAGE_IMPORT";
  importJobId?: string | null;
}

export interface PadronSummary {
  total: number,
  enabledToVote: number,
  disabledToVote: number,
}

export type PadronImportJobStatus =
  | "PROCESSING"
  | "PARSED"
  | "PARSED_WITH_ERRORS"
  | "FAILED"
  | "CONFIRMED";

export type PadronImportSourceType = "PDF" | "IMAGE" | "SYSTEM";

export interface PadronImportError {
  code: string;
  message: string;
  rowIndex?: number | null;
  rawValue?: string | null;
}

export interface PadronImportJobSummary {
  parsedCount: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  stagingCount: number;
  enabledCount: number;
  disabledCount: number;
  missingIdentityCount: number;
}

export interface PadronImportJob {
  importJobId: string;
  eventId: string;
  tenantId: string;
  sourceType: PadronImportSourceType;
  status: PadronImportJobStatus;
  isActiveDraft: boolean;
  originalFile: {
    fileName: string;
    mimeType: string;
    size: number;
    sha256: string;
  };
  parser: {
    provider: string;
    model: string | null;
    usedFallback: boolean;
  };
  summary: PadronImportJobSummary;
  errors: PadronImportError[];
  processedAt?: string | null;
  confirmedAt?: string | null;
  confirmedPadronVersionId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PadronWorkflowVersion {
  padronVersionId: string;
  createdAt?: string | null;
  createdBy: string;
  totals: {
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
  };
  sourceType: "CSV_LEGACY" | "PDF_IMPORT" | "IMAGE_IMPORT";
  importJobId?: string | null;
  comparisonStatus?: "PENDING" | "OK" | "FAILED";
  certificate?: {
    exists: boolean;
    materializable?: boolean;
    [key: string]: unknown;
  };
}

export interface PadronWorkflowSummary {
  eventId: string;
  eventState?: string;
  canEditPadronInLimitedMode?: boolean;
  currentVersion: PadronWorkflowVersion | null;
  activeDraft: PadronImportJob | null;
}

export interface PadronStagingEntry {
  id: string;
  importJobId: string;
  ci: string;
  enabled: boolean;
  hasIdentity: boolean;
  sourceKind: "PARSED" | "MANUAL" | "CLONED";
  sourceRow?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PadronStagingList {
  importJob: PadronImportJob | null;
  data: PadronStagingEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConfirmPadronStagingResult {
  importJobId: string;
  padronVersionId: string;
  state: "CONFIRMED";
  totals: {
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
  };
  comparisonStatus: "PENDING" | "OK" | "FAILED";
  sourceType: "PDF_IMPORT" | "IMAGE_IMPORT";
  certificate?: {
    exists: boolean;
    materializable?: boolean;
    [key: string]: unknown;
  };
}

export interface PadronVoter {
  id: string;
  carnet: string;
  carnetNorm: string;
  fullName?: string;
  email?: string;
  enabled: boolean;
  status: "valid" | "invalid";
  invalidReason?: string;
  createdAt?: string;
}

export interface CurrentPadronVoterMutationResult {
  id: string;
  padronVersionId: string;
  carnetNorm: string;
  enabled: boolean;
  mode?: 'VOTING_LIMITED';
}

export interface PadronImportResult {
  versionId: string;
  padronVersionId: string;
  fileDigest: string;
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  uploadedAt?: string;
  totals?: {
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
  };
}

export interface PadronCsvDownload {
  content: string;
  fileName: string;
}

export interface EligibilityResult {
  status: string;
  eligible: boolean;
  carnet?: string;
  normalizedCarnet?: string;
  referenceVersion?: string | null;
  reason?: string;
}

export interface ParticipationStatus {
  status: string;
  hasParticipated: boolean;
  alreadyVoted: boolean;
  canVote: boolean;
  participatedAt?: string;
}

export type PresentialSessionStatus =
  | "READY"
  | "CLAIMED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export interface PresentialSession {
  id: string;
  eventId: string;
  stationId: string;
  status: PresentialSessionStatus;
  rotationNumber: number;
  expiresAt?: string | null;
  claimedAt?: string | null;
  completedAt?: string | null;
  qrToken?: string | null;
  qrValue?: string | null;
}

export interface PresentialCurrentState {
  eventId: string;
  stationId: string;
  kioskEnabled: boolean;
  eventState: string;
  isEventActive: boolean;
  session: PresentialSession | null;
}

export interface PresentialKioskBootstrap {
  authHeader: string;
  currentPath: string;
  streamPath: string;
}

export interface CreatePresentialSessionResult {
  eventId: string;
  stationId: string;
  kioskEnabled: boolean;
  kioskAccessToken: string | null;
  kioskBootstrap: PresentialKioskBootstrap;
  currentSession: PresentialSession | null;
  claimTtlSeconds: number;
  readyTtlSeconds: number;
}

export interface PresentialSessionRotatedEvent {
  eventId: string;
  stationId: string;
  previousSessionId: string;
  session: PresentialSession | null;
}

export interface EventResults {
  eventId: string;
  status: "PENDING" | "PARTIAL" | "FINAL";
  roles: RoleResults[];
  lastUpdated?: string;
  publishedAt?: string;
  source?: string;
  txHash?: string;
  blockNumber?: string;
}

export interface RoleResults {
  roleName: string;
  total: number;
  ranking: RankingItem[];
  winners: string[];
}

export interface EventNews {
  id?: string;
  eventId: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  link?: string;
  publishedAt?: string;
  sent?: number;
  skipped?: string | null;
}

export interface PublishEventResponse {
  id: string;
  state: VotingEventStatus;
  nullifiers?: string[];
  officialPublishedAt?: string | null;
  publishDeadline?: string | null;
  publicationConfirmed?: boolean;
  publicationWindow?: PublicationWindow;
  publicUrl?: string;
  publicPath?: string;
}

export interface PublicationWindow {
  deadline?: string | null;
  canConfirmOfficialPublication: boolean;
  expired: boolean;
  hoursUntilDeadline: number | null;
}

export interface ReviewReadinessResponse {
  id: string;
  state: VotingEventStatus;
  isReady: boolean;
  pending: string[];
  publishDeadline?: string | null;
  publicationWindow?: PublicationWindow;
}

export type ComparisonReportStatus = "PENDING" | "OK" | "FAILED";
