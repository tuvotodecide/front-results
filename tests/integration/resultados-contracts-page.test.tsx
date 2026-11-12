import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContractsPage from "@/domains/resultados/admin/screens/ContractsPage";

const harness = vi.hoisted(() => ({
  contracts: [] as any[],
  create: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("@/domains/resultados/components/BackButton", () => ({
  default: () => <button type="button">Volver</button>,
}));

vi.mock("@/components/Modal", () => ({
  default: ({ children, isOpen, title }: { children: ReactNode; isOpen: boolean; title: string }) =>
    isOpen ? <section role="dialog" aria-label={title}>{children}</section> : null,
}));

vi.mock("@/store/configurations/configurationsEndpoints", () => ({
  useGetConfigurationsQuery: () => ({
    data: [
      { id: "el-dep", name: "Subnacionales 2026", type: "departamental", isActive: true },
      { id: "el-old", name: "Generales 2025", type: "presidential", isActive: false },
    ],
  }),
}));

vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useGetDepartmentsQuery: () => ({
    data: { data: [{ _id: "dep-lp", name: "La Paz" }, { _id: "dep-or", name: "Oruro" }] },
  }),
}));

vi.mock("@/store/municipalities/municipalitiesEndpoints", () => ({
  useGetMunicipalityQuery: (id: string, options?: { skip?: boolean }) => ({
    data:
      options?.skip || id !== "mun-ec"
        ? undefined
        : { _id: "mun-ec", name: "El Alto", provinceId: { _id: "p", name: "Murillo", departmentId: { _id: "dep-lp", name: "La Paz" } } },
  }),
}));

vi.mock("@/store/electionParties/electionPartiesEndpoints", () => ({
  useGetMunicipalitiesByDepartmentIdQuery: (departmentId: string, options?: { skip?: boolean }) => ({
    data: options?.skip || departmentId !== "dep-lp" ? [] : [{ _id: "mun-ec", name: "El Alto" }, { _id: "mun-lp", name: "La Paz" }],
    isFetching: false,
  }),
}));

vi.mock("@/store/accessApprovals", () => ({
  useGetTerritorialAccessRequestsQuery: () => ({
    data: [
      { userId: "u-gov", name: "Gobernadora Oruro", role: "GOVERNOR", status: "APPROVED", votingDepartmentId: "dep-or", departmentName: "Oruro" },
      { userId: "u-mayor", name: "Alcalde El Alto", role: "MAYOR", status: "APPROVED", votingMunicipalityId: "mun-ec", municipalityName: "El Alto" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/store/contracts/contractsEndpoints", () => ({
  useGetActiveContractsQuery: () => ({ data: { data: harness.contracts, total: harness.contracts.length }, isLoading: false }),
  useCreateContractMutation: () => [(payload: unknown) => ({ unwrap: () => harness.create(payload) }), { isLoading: false }],
  useDeactivateContractMutation: () => [(payload: unknown) => ({ unwrap: () => harness.deactivate(payload) }), { isLoading: false }],
}));

describe("Resultados | pantalla de contratos", () => {
  beforeEach(() => {
    harness.contracts = [];
    harness.create.mockReset().mockResolvedValue({});
    harness.deactivate.mockReset().mockResolvedValue({});
  });

  it("crea un contrato de gobernador con su departamento registrado y la elección activa", async () => {
    const user = userEvent.setup();
    render(<ContractsPage />);

    await user.selectOptions(screen.getByLabelText(/Cliente aprobado/), "u-gov");
    expect(screen.getByLabelText(/Departamento/)).toHaveValue("dep-or");
    expect(screen.getByLabelText(/Elección/)).toHaveValue("el-dep");

    await user.click(screen.getByRole("button", { name: "Crear contrato" }));

    await waitFor(() =>
      expect(harness.create).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: "u-gov", electionId: "el-dep", departmentId: "dep-or" }),
      ),
    );
    expect(harness.create.mock.calls[0][0]).not.toHaveProperty("municipalityId");
    expect(screen.getByRole("status")).toHaveTextContent("Contrato creado para Gobernadora Oruro");
  });

  it("para un alcalde deduce el departamento de su municipio y envía solo el municipio", async () => {
    const user = userEvent.setup();
    render(<ContractsPage />);

    await user.selectOptions(screen.getByLabelText(/Cliente aprobado/), "u-mayor");
    expect(screen.getByLabelText(/Departamento/)).toHaveValue("dep-lp");
    expect(screen.getByLabelText(/Municipio/)).toHaveValue("mun-ec");
    // Elección departamental con un alcalde: se avisa del desajuste
    expect(screen.getByText(/lo habitual es un contrato de gobernador/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear contrato" }));

    await waitFor(() =>
      expect(harness.create).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: "u-mayor", municipalityId: "mun-ec" }),
      ),
    );
    expect(harness.create.mock.calls[0][0]).not.toHaveProperty("departmentId");
  });

  it("avisa si el territorio elegido no es el registrado", async () => {
    const user = userEvent.setup();
    render(<ContractsPage />);

    await user.selectOptions(screen.getByLabelText(/Cliente aprobado/), "u-gov");
    await user.selectOptions(screen.getByLabelText(/Departamento/), "dep-lp");

    expect(screen.getByText(/no es el que el cliente registró/)).toBeInTheDocument();
  });

  it("bloquea un segundo contrato del mismo cliente en la misma elección", async () => {
    harness.contracts = [
      {
        id: "c1", clientId: "u-gov", client: { name: "Gobernadora Oruro" }, clientRole: "GOVERNOR",
        territory: { departmentId: "dep-or", departmentName: "Oruro", municipalityId: null },
        electionId: "el-dep", active: true, startDate: "2026-11-10T00:00:00.000Z",
      },
    ];
    const user = userEvent.setup();
    render(<ContractsPage />);

    await user.selectOptions(screen.getByLabelText(/Cliente aprobado/), "u-gov");

    expect(screen.getByText(/ya tiene un contrato activo en esta elección/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear contrato" })).toBeDisabled();
  });

  it("lista los contratos activos y desactiva uno tras confirmar", async () => {
    harness.contracts = [
      {
        id: "c1", clientId: "u-gov", client: { name: "Gobernadora Oruro", email: "gob@test.local" }, clientRole: "GOVERNOR",
        territory: { departmentId: "dep-or", departmentName: "Oruro", municipalityId: null },
        electionId: "el-dep", active: true, startDate: "2026-11-10T00:00:00.000Z",
      },
    ];
    const user = userEvent.setup();
    render(<ContractsPage />);

    const row = screen.getByRole("row", { name: /Gobernadora Oruro/ });
    expect(row).toHaveTextContent("Subnacionales 2026");
    expect(row).toHaveTextContent("Departamento de Oruro");

    await user.click(within(row).getByRole("button", { name: "Desactivar" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(harness.deactivate).toHaveBeenCalledWith("c1"));
  });
});
