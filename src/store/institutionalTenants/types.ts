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

export interface TenantAdminAssignment {
  tenantId: string;
  userId: string;
  active: boolean;
}
