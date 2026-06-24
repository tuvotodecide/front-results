import type { InstitutionalApplication } from "@/store/accessApprovals";

export const accessApprovalApplications: InstitutionalApplication[] = [
  {
    id: "app-pending",
    dni: "1234567",
    name: "Ana Pendiente",
    email: "ana.pendiente@test.local",
    institutionName: "Institucion Pendiente",
    tenantId: "tenant-pending",
    status: "PENDING_APPROVAL",
    createdAt: "2026-04-10T12:00:00.000Z",
  },
  {
    id: "app-approved",
    dni: "7654321",
    name: "Bruno Aprobado",
    email: "bruno.aprobado@test.local",
    institutionName: "Institucion Aprobada",
    tenantId: "tenant-approved",
    status: "APPROVED",
    createdAt: "2026-04-09T12:00:00.000Z",
  },
  {
    id: "app-rejected",
    dni: "1112223",
    name: "Carla Rechazada",
    email: "carla.rechazada@test.local",
    institutionName: "Institucion Rechazada",
    tenantId: "tenant-rejected",
    status: "REJECTED",
    reason: "Documentacion incompleta",
    createdAt: "2026-04-08T12:00:00.000Z",
  },
  {
    id: "app-revoked",
    dni: "4445556",
    name: "Diego Revocado",
    email: "diego.revocado@test.local",
    institutionName: "Institucion Revocada",
    tenantId: "tenant-revoked",
    status: "REVOKED",
    reason: "Acceso revocado",
    createdAt: "2026-04-07T12:00:00.000Z",
  },
];

export const buildAccessApprovalApplication = (
  overrides: Partial<InstitutionalApplication>,
): InstitutionalApplication => ({
  id: "app-test",
  dni: "9000000",
  name: "Solicitud Test",
  email: "solicitud@test.local",
  institutionName: "Institucion Test",
  tenantId: "tenant-test",
  status: "PENDING_APPROVAL",
  createdAt: "2026-04-10T12:00:00.000Z",
  ...overrides,
});
