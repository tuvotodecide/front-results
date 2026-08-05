import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DepartmentsPage from "@/domains/resultados/admin/screens/DepartmentsPage";
import ProvincesPage from "@/domains/resultados/admin/screens/ProvincesPage";
import MunicipalitiesPage from "@/domains/resultados/admin/screens/MunicipalitiesPage";
import ElectoralSeatsPage from "@/domains/resultados/admin/screens/ElectoralSeatsPage";
import ElectoralLocationsPage from "@/domains/resultados/admin/screens/ElectoralLocationsPage";
import ElectoralTablesPage from "@/domains/resultados/admin/screens/ElectoralTablesPage";

const harness = vi.hoisted(() => ({
  navigate: vi.fn(),
  getDepartments: vi.fn(),
  getProvinces: vi.fn(),
  getMunicipalities: vi.fn(),
  getSeats: vi.fn(),
  getLocations: vi.fn(),
  getTables: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  Link: ({ children, to }: { children: string; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => harness.navigate,
}));

vi.mock("@/domains/resultados/components/BackButton", () => ({
  default: () => <button type="button">Volver</button>,
}));

vi.mock("@/components/Modal", () => ({
  default: ({ children, isOpen, title }: { children: ReactNode; isOpen: boolean; title: string }) =>
    isOpen ? <section role="dialog" aria-label={title}>{children}</section> : null,
}));

vi.mock("@/components/SearchForm", () => ({
  default: ({ onSearch }: { onSearch: (filters: Record<string, string>) => void }) => (
    <button type="button" onClick={() => onSearch({ search: "La Paz", department: "dep-lp", province: "prov-murillo", municipality: "mun-lp", electoralSeat: "seat-1" })}>
      Aplicar filtros
    </button>
  ),
}));

vi.mock("@/components/Pagination", () => ({
  default: ({ currentPage, onPageChange }: { currentPage: number; onPageChange: (page: number) => void }) => (
    <button type="button" onClick={() => onPageChange(currentPage + 1)}>Página siguiente</button>
  ),
}));

vi.mock("@/components/Table", () => {
  const Table = ({ data, columns, onDelete, children }: {
    data: Array<Record<string, unknown>>;
    columns: Array<{ accessorKey?: string; header: string; cell?: ({ row }: { row: { original: Record<string, unknown> } }) => ReactNode }>;
    onDelete: (item: Record<string, unknown>) => void;
    children: ReactNode;
  }) => (
    <div>
      {children}
      <table>
        <thead><tr>{columns.map((column) => <th key={column.header}>{column.header}</th>)}</tr></thead>
        <tbody>{data.map((item) => <tr key={String(item._id)}>
          {columns.map((column) => <td key={column.header}>{column.cell ? column.cell({ row: { original: item } }) : String(item[column.accessorKey ?? ""] ?? "")}</td>)}
          <td><button type="button" onClick={() => onDelete(item)}>Eliminar</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
  Table.Header = ({ children }: { children: ReactNode }) => <>{children}</>;
  Table.Footer = ({ children }: { children: ReactNode }) => <>{children}</>;
  return { default: Table };
});

const response = (data: Record<string, unknown>[]) => ({
  data: { data, pagination: { pages: 2, total: data.length } },
});
vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useGetDepartmentsQuery: (...args: unknown[]) => harness.getDepartments(...args),
  useDeleteDepartmentMutation: () => [
    (...args: unknown[]) => ({ unwrap: () => harness.remove(...args) }),
  ],
}));
vi.mock("@/store/provinces/provincesEndpoints", () => ({
  useGetProvincesQuery: (...args: unknown[]) => harness.getProvinces(...args),
  useDeleteProvinceMutation: () => [
    (...args: unknown[]) => ({ unwrap: () => harness.remove(...args) }),
  ],
}));
vi.mock("@/store/municipalities/municipalitiesEndpoints", () => ({
  useGetMunicipalitiesQuery: (...args: unknown[]) => harness.getMunicipalities(...args),
  useDeleteMunicipalityMutation: () => [
    (...args: unknown[]) => ({ unwrap: () => harness.remove(...args) }),
  ],
}));
vi.mock("@/store/electoralSeats/electoralSeatsEndpoints", () => ({
  useGetElectoralSeatsQuery: (...args: unknown[]) => harness.getSeats(...args),
  useDeleteElectoralSeatMutation: () => [
    (...args: unknown[]) => ({ unwrap: () => harness.remove(...args) }),
  ],
}));
vi.mock("@/store/electoralLocations/electoralLocationsEndpoints", () => ({
  useGetElectoralLocationsQuery: (...args: unknown[]) => harness.getLocations(...args),
  useDeleteElectoralLocationMutation: () => [
    (...args: unknown[]) => ({ unwrap: () => harness.remove(...args) }),
  ],
}));
vi.mock("@/store/electoralTables/electoralTablesEndpoints", () => ({
  useGetElectoralTablesQuery: (...args: unknown[]) => harness.getTables(...args),
  useDeleteElectoralTableMutation: () => [
    (...args: unknown[]) => ({ unwrap: () => harness.remove(...args) }),
  ],
}));

const hierarchy = {
  _id: "dep-lp", name: "La Paz", active: true,
};
const province = { _id: "prov-murillo", name: "Murillo", active: true, departmentId: hierarchy, totalTables: 12 };
const municipality = { _id: "mun-lp", name: "La Paz", active: true, provinceId: province, totalTables: 12 };
const seat = { _id: "seat-1", name: "Central", idLoc: "LP-01", active: true, municipalityId: municipality };
const location = { _id: "loc-1", name: "Unidad Central", fid: "F-1", code: "REC-01", district: "D-1", zone: "Zona Sur", active: true, electoralSeatId: seat };
const table = { _id: "table-1", tableNumber: "15", tableCode: "LP-001-15", active: true, electoralLocationId: location };

describe("MX-10 | listados territoriales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    harness.remove.mockResolvedValue(undefined);
    harness.getDepartments.mockReturnValue(response([{ ...hierarchy, code: "LP", totalTables: 12 }]));
    harness.getProvinces.mockReturnValue(response([province]));
    harness.getMunicipalities.mockReturnValue(response([municipality]));
    harness.getSeats.mockReturnValue(response([seat]));
    harness.getLocations.mockReturnValue(response([location]));
    harness.getTables.mockReturnValue(response([table]));
  });

  afterEach(() => cleanup());

  it("[MX-10][TER-LST-P1-001][INTEGRACION] muestra departamentos, estado, total, búsqueda y paginación", async () => {
    const user = userEvent.setup();
    render(<DepartmentsPage />);
    expect(screen.getByRole("heading", { name: "Departamentos" })).toBeInTheDocument();
    expect(screen.getByText("La Paz")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(harness.getDepartments).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, search: "La Paz" }));
  });

  it("[MX-10][TER-LST-P1-002][INTEGRACION] filtra provincias por departamento y conserva sus totales", async () => {
    const user = userEvent.setup();
    render(<ProvincesPage />);
    expect(screen.getByText("Murillo")).toBeInTheDocument();
    expect(screen.getByText("La Paz")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(harness.getProvinces).toHaveBeenLastCalledWith(expect.objectContaining({ department: "dep-lp" }));
  });

  it("[MX-10][TER-LST-P1-003][INTEGRACION] muestra municipios dentro de departamento y provincia", async () => {
    const user = userEvent.setup();
    render(<MunicipalitiesPage />);
    expect(screen.getAllByText("La Paz")).toHaveLength(2);
    expect(screen.getByText("Murillo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(harness.getMunicipalities).toHaveBeenLastCalledWith(expect.objectContaining({ department: "dep-lp", province: "prov-murillo" }));
  });

  it("[MX-10][TER-LST-P1-004][INTEGRACION] muestra asientos de un municipio con identificador real", async () => {
    const user = userEvent.setup();
    render(<ElectoralSeatsPage />);
    expect(screen.getByText("LP-01")).toBeInTheDocument();
    expect(screen.getByText("Central")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(harness.getSeats).toHaveBeenLastCalledWith(expect.objectContaining({ municipality: "mun-lp" }));
  });

  it("[MX-10][TER-LST-P1-005][INTEGRACION] muestra recinto, código, distrito y zona dentro de su jerarquía", async () => {
    const user = userEvent.setup();
    render(<ElectoralLocationsPage />);
    expect(screen.getByText("REC-01")).toBeInTheDocument();
    expect(screen.getByText("D-1")).toBeInTheDocument();
    expect(screen.getByText("Zona Sur")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(harness.getLocations).toHaveBeenLastCalledWith(expect.objectContaining({ electoralSeat: "seat-1" }));
  });

  it("[MX-10][TER-LST-P1-006][INTEGRACION] encuentra mesa por código y muestra la jerarquía visible", async () => {
    const user = userEvent.setup();
    render(<ElectoralTablesPage />);
    expect(screen.getByText("LP-001-15")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Unidad Central")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(harness.getTables).toHaveBeenLastCalledWith(expect.objectContaining({ search: "La Paz" }));
  });

  it("[MX-10][TER-DEL-P0-001][INTEGRACION] confirma eliminación física y deja intacto el listado al cancelar", async () => {
    const user = userEvent.setup();
    render(<DepartmentsPage />);
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(screen.getByRole("dialog", { name: "Confirmar eliminación" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(harness.remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(harness.remove).toHaveBeenCalledWith("dep-lp");
  });

  it("[MX-10][TER-ERR-P1-004][INTEGRACION] conserva la navegación y permite recuperar la consulta territorial tras un error", async () => {
    const user = userEvent.setup();
    harness.getDepartments.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: harness.getDepartments,
    });
    render(<DepartmentsPage />);

    expect(screen.queryByText("La Paz")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(harness.getDepartments).toHaveBeenCalledWith(
      expect.objectContaining({ search: "La Paz" }),
    );
    expect(harness.navigate).not.toHaveBeenCalled();
  });
});
