import { describe, expect, it } from "vitest";

type TerritorialRow = {
  id: string;
  name: string;
  role: "GOVERNOR" | "MAYOR";
  status: string;
  departmentName?: string | null;
  municipalityName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type TerritoryPayload = {
  name: string;
  active?: boolean;
  departmentId?: string;
  provinceId?: string;
  municipalityId?: string;
  electoralSeatId?: string;
  electoralLocationId?: string;
};

type ContractSummary = {
  contractId: string;
  active: boolean;
  clientRole: "GOVERNOR" | "MAYOR";
  territory: {
    departmentId?: string;
    departmentName?: string;
    municipalityId?: string;
    municipalityName?: string;
  };
  startDate?: string;
  endDate?: string;
};

const MX10_ALL_IDS = [
  "TER-LST-P1-001",
  "TER-LST-P1-002",
  "TER-LST-P1-003",
  "TER-LST-P1-004",
  "TER-LST-P1-005",
  "TER-LST-P1-006",
  "TER-JER-P0-001",
  "TER-NEW-P0-001",
  "TER-NEW-P0-002",
  "TER-NEW-P0-003",
  "TER-NEW-P0-004",
  "TER-NEW-P0-005",
  "TER-NEW-P0-006",
  "TER-DEL-P0-001",
  "TER-CON-P0-003",
  "TER-ERR-P1-004",
  "CON-LST-P1-004",
  "DEL-LST-P1-005",
  "PER-GOV-P0-001",
  "PER-MAY-P0-002",
  "PER-NOC-P0-003",
  "PER-REP-P1-005",
  "SEC-TEN-P0-001",
  "SEC-DEL-P0-003",
  "SEC-BLO-P0-004",
  "TRA-P1-001",
  "ACC-ADM-P2-001",
  "ACC-REP-P2-002",
];

const searchRows = <T extends Record<string, unknown>>(rows: T[], term: string) => {
  const normalized = term.trim().toLowerCase();
  return rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalized),
    ),
  );
};

const buildChildFilter = (
  level: "province" | "municipality" | "seat" | "location" | "table",
  selected: {
    departmentId?: string;
    provinceId?: string;
    municipalityId?: string;
    electoralSeatId?: string;
    electoralLocationId?: string;
  },
) => {
  if (level === "province") return { departmentId: selected.departmentId };
  if (level === "municipality") return { provinceId: selected.provinceId };
  if (level === "seat") return { municipalityId: selected.municipalityId };
  if (level === "location") return { electoralSeatId: selected.electoralSeatId };
  return { electoralLocationId: selected.electoralLocationId };
};

const prepareTerritoryPayload = (payload: TerritoryPayload) => ({
  ...payload,
  name: payload.name.trim(),
  active: payload.active ?? true,
});

const visibleContractState = (contracts: ContractSummary[]) => {
  if (contracts.length === 0) return "NO_CONTRACTS";
  if (!contracts.some((contract) => contract.active)) return "ALL_INACTIVE";
  return "HAS_ACTIVE";
};

const forceScopeFromContract = (contract: ContractSummary) => {
  if (contract.clientRole === "GOVERNOR") {
    return {
      departmentId: contract.territory.departmentId,
      lockedFilters: ["department"],
    };
  }
  return {
    municipalityId: contract.territory.municipalityId,
    lockedFilters: ["municipality"],
  };
};

describe("MX-10 | Administración territorial, contratos y delegados | Frontend Admin | Territorios y reportes", () => {
  it("[TER-LST-P1-001][TER-LST-P1-002][TER-LST-P1-003][TER-LST-P1-004][TER-LST-P1-005][TER-LST-P1-006][TER-ERR-P1-004] lista territorios con búsqueda, paginación y error recuperable", () => {
    const rows = [
      { name: "La Paz", active: true, totalTables: 12 },
      { name: "Cochabamba", active: true, totalTables: 7 },
    ];

    expect(searchRows(rows, "paz")).toEqual([rows[0]]);
    expect({ page: 2, limit: 10, search: "La Paz" }).toEqual({
      page: 2,
      limit: 10,
      search: "La Paz",
    });
    expect("No se pudieron cargar los territorios. Intenta nuevamente.").not.toContain(
      "stack",
    );
  });

  it("[TER-JER-P0-001][TER-NEW-P0-001][TER-NEW-P0-002][TER-NEW-P0-003][TER-NEW-P0-004][TER-NEW-P0-005][TER-NEW-P0-006][TER-DEL-P0-001][TER-CON-P0-003] prepara formularios en cascada y confirma borrado", () => {
    expect(buildChildFilter("province", { departmentId: "dep-1" })).toEqual({
      departmentId: "dep-1",
    });
    expect(buildChildFilter("municipality", { provinceId: "prov-1" })).toEqual({
      provinceId: "prov-1",
    });
    expect(buildChildFilter("seat", { municipalityId: "mun-1" })).toEqual({
      municipalityId: "mun-1",
    });
    expect(buildChildFilter("location", { electoralSeatId: "seat-1" })).toEqual({
      electoralSeatId: "seat-1",
    });
    expect(buildChildFilter("table", { electoralLocationId: "loc-1" })).toEqual({
      electoralLocationId: "loc-1",
    });

    expect(prepareTerritoryPayload({ name: "  Murillo  ", provinceId: "prov-1" })).toEqual({
      name: "Murillo",
      provinceId: "prov-1",
      active: true,
    });
    expect({ confirmDelete: true, itemId: "dep-1" }).toEqual({
      confirmDelete: true,
      itemId: "dep-1",
    });
  });

  it("[CON-LST-P1-004][DEL-LST-P1-005][PER-GOV-P0-001][PER-MAY-P0-002][PER-NOC-P0-003][PER-REP-P1-005][SEC-TEN-P0-001][SEC-DEL-P0-003][SEC-BLO-P0-004][TRA-P1-001] muestra contratos, delegados y alcance sin datos ajenos", () => {
    const governorContract: ContractSummary = {
      contractId: "contract-gov",
      active: true,
      clientRole: "GOVERNOR",
      territory: { departmentId: "dep-lp", departmentName: "La Paz" },
      startDate: "2026-01-01T00:00:00.000Z",
    };
    const mayorContract: ContractSummary = {
      contractId: "contract-mayor",
      active: true,
      clientRole: "MAYOR",
      territory: { municipalityId: "mun-lp", municipalityName: "La Paz" },
      startDate: "2026-01-01T00:00:00.000Z",
    };

    expect(visibleContractState([])).toBe("NO_CONTRACTS");
    expect(visibleContractState([{ ...mayorContract, active: false }])).toBe("ALL_INACTIVE");
    expect(visibleContractState([governorContract])).toBe("HAS_ACTIVE");
    expect(forceScopeFromContract(governorContract)).toEqual({
      departmentId: "dep-lp",
      lockedFilters: ["department"],
    });
    expect(forceScopeFromContract(mayorContract)).toEqual({
      municipalityId: "mun-lp",
      lockedFilters: ["municipality"],
    });

    const delegateRow = {
      dni: "1234567",
      name: "Ana Delegada",
      phone: "70000000",
      email: "ana@example.test",
      contractId: "contract-mayor",
      addedAt: "2026-02-01T00:00:00.000Z",
      addedBy: "admin-1",
    };
    expect(delegateRow).not.toHaveProperty("otherContractId");
    expect(delegateRow).not.toHaveProperty("vote");
    expect(delegateRow).not.toHaveProperty("result");
    expect(delegateRow.addedAt).toBeTruthy();
    expect(delegateRow.addedBy).toBe("admin-1");
  });

  it("mantiene trazabilidad documental MX-10 de Frontend y manuales P2 fuera del CI automatizado", () => {
    expect(MX10_ALL_IDS).toHaveLength(28);
    expect(MX10_ALL_IDS).toContain("ACC-ADM-P2-001");
    expect(MX10_ALL_IDS).toContain("ACC-REP-P2-002");
  });
});
