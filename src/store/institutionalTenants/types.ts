// Tipos para Institutional Tenants

export interface CreateInstitutionalTenantDto {
  name: string;
  description?: string;
}

export interface AssignTenantAdminDto {
  userId: string;
  active?: boolean; // default: true
}

export interface UpdateTenantAdminStatusDto {
  active: boolean;
  reason?: string;
}

export interface TransferTenantPrimaryDto {
  assignmentId: string;
  reason?: string;
}

export interface PrimaryTransferAuthorizationResponse {
  tenantId: string;
  transferId: string;
  applicationId: string;
  targetAssignmentId: string | null;
  previousPrimaryUserId: string | null;
  targetUserId: string | null;
  status: string;
  mobileAuthorizationAction: "CHANGE_INSTITUTION_ADMIN";
  mobileAuthorizationStatus: string;
  stableInstitutionId: string | null;
  targetWallet: string | null;
  signerWallet: string | null;
  expiresAt: string | null;
}

export interface InstitutionalTenant {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface PublicInstitutionTenant {
  institutionId: string;
  institutionName: string;
}

export interface PublicInstitutionTenantListResponse {
  items: PublicInstitutionTenant[];
  total: number;
  page: number;
  limit: number;
}

export interface PublicInstitutionTenantListQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface TenantAdminAssignment {
  tenantId: string;
  userId: string;
  active: boolean;
  assignmentId?: string;
  name?: string | null;
  email?: string | null;
  userActive?: boolean;
  accountAddress?: string | null;
  hasWallet?: boolean;
  requiresWalletUpdate?: boolean;
  walletStatus?: "MISSING" | "VERIFIED" | string;
  walletVerifiedAt?: string | null;
  walletVerificationSource?: string | null;
  institutionalRole?: "PRIMARY" | "SECONDARY" | string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED" | string;
  requestedAt?: string | null;
  approvedAt?: string | null;
  revokedAt?: string | null;
}

export interface TenantAdminListResponse {
  tenantId: string;
  data: TenantAdminAssignment[];
  total: number;
}
