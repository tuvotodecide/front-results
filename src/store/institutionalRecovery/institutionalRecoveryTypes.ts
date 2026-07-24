export type InstitutionalRecoveryStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CreateInstitutionalRecoveryRequest = {
  institutionId: string;
  fullName: string;
  phoneNumber: string;
  newEmail: string;
  supervisorPhoneNumber: string;
};

export type InstitutionalRecoveryPublicReceipt = {
  requestId: string;
  status: InstitutionalRecoveryStatus;
  requestedAt: string;
};

export type InstitutionalRecoveryListQuery = {
  status?: InstitutionalRecoveryStatus;
};

export type InstitutionalRecoveryListItem = {
  requestId: string;
  tenantId: string;
  institutionName: string;
  fullName: string;
  phoneNumber: string;
  newEmail: string;
  supervisorPhoneNumber: string;
  status: InstitutionalRecoveryStatus;
  requestedAt: string | null;
  resolvedAt: string | null;
};

export type InstitutionalRecoveryDetail = InstitutionalRecoveryListItem & {
  candidateUserId: string | null;
  candidateAssignmentId: string | null;
  currentEmail: string | null;
  accountAddress: string | null;
  institutionalRole: string | null;
  warnings: string[];
  resolutionReason: string | null;
};

export type InstitutionalRecoveryListResponse = {
  data: InstitutionalRecoveryListItem[];
  total: number;
};

export type ApproveInstitutionalRecoveryRequest = {
  targetUserId: string;
  targetAssignmentId: string;
  reason?: string;
};

export type RejectInstitutionalRecoveryRequest = {
  reason?: string;
};

export type InstitutionalRecoveryApprovalResponse = {
  requestId: string;
  status: InstitutionalRecoveryStatus;
  tenantId: string;
  userId: string;
  assignmentId: string;
  resolvedAt: string | null;
};
