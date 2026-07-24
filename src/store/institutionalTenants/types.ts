// Tipos para Institutional Tenants

export interface CreateInstitutionalTenantDto {
  name: string;
  description?: string;
}

export interface AssignTenantAdminDto {
  userId: string;
  active?: boolean; // default: true
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
}
