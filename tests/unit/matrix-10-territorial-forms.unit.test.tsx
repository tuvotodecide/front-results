import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DepartmentForm from "@/domains/resultados/admin/screens/DepartmentFormPage";
import ProvinceForm from "@/domains/resultados/admin/screens/ProvincesFormPage";
import MunicipalityForm from "@/domains/resultados/admin/screens/MunicipalityFormPage";
import ElectoralSeatForm from "@/domains/resultados/admin/screens/ElectoralSeatFormPage";
import ElectoralLocationForm from "@/domains/resultados/admin/screens/ElectoralLocationFormPage";
import ElectoralTableForm from "@/domains/resultados/admin/screens/ElectoralTableFormPage";

const harness = vi.hoisted(() => ({
  navigate: vi.fn(), params: {} as Record<string, string>,
  createDepartment: vi.fn(), createProvince: vi.fn(), createMunicipality: vi.fn(), createSeat: vi.fn(), createLocation: vi.fn(), createTable: vi.fn(),
  getDepartments: vi.fn(), getProvincesByDepartment: vi.fn(), getMunicipalitiesByProvince: vi.fn(), getSeatsByMunicipality: vi.fn(), getLocationsBySeat: vi.fn(),
  mutation: (action: ReturnType<typeof vi.fn>) => () => [(input: unknown) => ({ unwrap: () => action(input) }), { isLoading: false, error: null }],
  query: () => ({ data: undefined, isLoading: false }),
  lazy: (action: ReturnType<typeof vi.fn>) => () => [(input: unknown) => ({ unwrap: () => action(input) })],
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({ useNavigate: () => harness.navigate, useParams: () => harness.params }));
vi.mock("@/components/LoadingButton", () => ({ default: ({ children, isLoading: _isLoading, ...props }: { children: ReactNode; isLoading?: boolean }) => <button {...props}>{children}</button> }));
vi.mock("@/components/Modal", () => ({ default: ({ isOpen, title }: { isOpen: boolean; title: string }) => isOpen ? <div role="dialog" aria-label={title}>{title}</div> : null }));
vi.mock("@/domains/resultados/components/BackButton", () => ({ default: () => <button type="button">Volver</button> }));
vi.mock("react-select/async", () => ({
  default: ({ isDisabled, loadOptions, name, onChange, value }: { isDisabled?: boolean; loadOptions?: (input: string) => Promise<unknown>; name: string; onChange: (option: { value: string; label: string }) => void; value?: { label: string } | null }) => {
    const option = { departmentId: { value: "dep-lp", label: "La Paz" }, provinceId: { value: "prov-murillo", label: "Murillo" }, municipalityId: { value: "mun-lp", label: "La Paz" }, electoralSeatId: { value: "seat-central", label: "Central" }, electoralLocationId: { value: "loc-central", label: "Recinto Central" } }[name];
    if (!option) return <button aria-label={name} disabled type="button">{value?.label ?? `Seleccionar ${name}`}</button>;
    return <button aria-label={name} disabled={isDisabled} type="button" onClick={async () => { await loadOptions?.(""); onChange(option); }}>{value?.label ?? `Seleccionar ${name}`}</button>;
  },
}));
vi.mock("@/store/departments/departmentsEndpoints", () => ({ useCreateDepartmentMutation: harness.mutation(harness.createDepartment), useUpdateDepartmentMutation: harness.mutation(vi.fn()), useGetDepartmentQuery: harness.query, useLazyGetDepartmentsQuery: harness.lazy(harness.getDepartments) }));
vi.mock("@/store/provinces/provincesEndpoints", () => ({ useCreateProvinceMutation: harness.mutation(harness.createProvince), useUpdateProvinceMutation: harness.mutation(vi.fn()), useGetProvinceQuery: harness.query, useLazyGetProvincesQuery: harness.lazy(vi.fn()), useLazyGetProvincesByDepartmentIdQuery: harness.lazy(harness.getProvincesByDepartment) }));
vi.mock("@/store/municipalities/municipalitiesEndpoints", () => ({ useCreateMunicipalityMutation: harness.mutation(harness.createMunicipality), useUpdateMunicipalityMutation: harness.mutation(vi.fn()), useGetMunicipalityQuery: harness.query, useLazyGetMunicipalitiesQuery: harness.lazy(vi.fn()), useLazyGetMunicipalitiesByProvinceIdQuery: harness.lazy(harness.getMunicipalitiesByProvince) }));
vi.mock("@/store/electoralSeats/electoralSeatsEndpoints", () => ({ useCreateElectoralSeatMutation: harness.mutation(harness.createSeat), useUpdateElectoralSeatMutation: harness.mutation(vi.fn()), useGetElectoralSeatQuery: harness.query, useLazyGetElectoralSeatsByMunicipalityIdQuery: harness.lazy(harness.getSeatsByMunicipality) }));
vi.mock("@/store/electoralLocations/electoralLocationsEndpoints", () => ({ useCreateElectoralLocationMutation: harness.mutation(harness.createLocation), useUpdateElectoralLocationMutation: harness.mutation(vi.fn()), useGetElectoralLocationQuery: harness.query, useLazyGetElectoralLocationsByElectoralSeatIdQuery: harness.lazy(harness.getLocationsBySeat) }));
vi.mock("@/store/electoralTables/electoralTablesEndpoints", () => ({ useCreateElectoralTableMutation: harness.mutation(harness.createTable), useUpdateElectoralTableMutation: harness.mutation(vi.fn()), useGetElectoralTableQuery: harness.query }));

const fill = async (user: ReturnType<typeof userEvent.setup>, label: string, value: string) => user.type(screen.getByLabelText(label), value);
const select = async (user: ReturnType<typeof userEvent.setup>, name: string) => user.click(screen.getByRole("button", { name }));
const throughMunicipality = async (user: ReturnType<typeof userEvent.setup>) => { await select(user, "departmentId"); await select(user, "provinceId"); await select(user, "municipalityId"); };
const fullHierarchy = async (user: ReturnType<typeof userEvent.setup>, includeLocation = false) => { await throughMunicipality(user); await select(user, "electoralSeatId"); if (includeLocation) await select(user, "electoralLocationId"); };

describe("MX-10 | formularios territoriales unitarios", () => {
  beforeEach(() => {
    vi.clearAllMocks(); harness.params = {};
    [harness.createDepartment, harness.createProvince, harness.createMunicipality, harness.createSeat, harness.createLocation, harness.createTable].forEach((action) => action.mockResolvedValue(undefined));
    harness.getDepartments.mockResolvedValue({ data: [{ _id: "dep-lp", name: "La Paz" }] });
    harness.getProvincesByDepartment.mockResolvedValue([{ _id: "prov-murillo", name: "Murillo" }]);
    harness.getMunicipalitiesByProvince.mockResolvedValue([{ _id: "mun-lp", name: "La Paz" }]);
    harness.getSeatsByMunicipality.mockResolvedValue([{ _id: "seat-central", name: "Central" }]);
    harness.getLocationsBySeat.mockResolvedValue([{ _id: "loc-central", name: "Recinto Central" }]);
  });
  afterEach(() => cleanup());

  it("[MX-10][TER-NEW-P0-001][UNITARIA] valida el nombre obligatorio y prepara nombre y estado del departamento", async () => {
    const user = userEvent.setup(); render(<DepartmentForm />); await user.click(screen.getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Este campo es obligatorio")).toBeInTheDocument(); await fill(user, "Nombre del Departamento", "La Paz"); await user.click(screen.getByRole("button", { name: "Guardar" })); await waitFor(() => expect(harness.createDepartment).toHaveBeenCalledWith({ name: "La Paz", active: true }));
  });
  it("[MX-10][TER-NEW-P0-002][UNITARIA] exige nombre y departamento para una provincia", async () => {
    const user = userEvent.setup(); render(<ProvinceForm />); await user.click(screen.getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Debe seleccionar un departamento")).toBeInTheDocument(); expect(screen.getAllByText("Este campo es obligatorio")).not.toHaveLength(0); await fill(user, "Nombre de la Provincia", "Murillo"); await select(user, "departmentId"); await user.click(screen.getByRole("button", { name: "Guardar" })); await waitFor(() => expect(harness.createProvince).toHaveBeenCalledWith({ name: "Murillo", active: true, departmentId: "dep-lp" }));
  });
  it("[MX-10][TER-NEW-P0-003][UNITARIA] exige nombre y provincia para un municipio", async () => {
    const user = userEvent.setup(); render(<MunicipalityForm />); await user.click(screen.getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Debe seleccionar una provincia")).toBeInTheDocument(); await fill(user, "Nombre del Municipio", "La Paz"); await select(user, "departmentId"); await select(user, "provinceId"); await user.click(screen.getByRole("button", { name: "Guardar" })); await waitFor(() => expect(harness.createMunicipality).toHaveBeenCalledWith({ name: "La Paz", active: true, provinceId: "prov-murillo" }));
  });
  it("[MX-10][TER-NEW-P0-004][UNITARIA] exige nombre, identificador y municipio para un asiento", async () => {
    const user = userEvent.setup(); render(<ElectoralSeatForm />); await user.click(screen.getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Debe seleccionar un municipio")).toBeInTheDocument(); await fill(user, "Nombre del Asiento Electoral", "Central"); await fill(user, "ID Localización", "LP-01"); await throughMunicipality(user); await user.click(screen.getByRole("button", { name: "Guardar" })); await waitFor(() => expect(harness.createSeat).toHaveBeenCalledWith({ name: "Central", idLoc: "LP-01", active: true, municipalityId: "mun-lp" }));
  });
  it("[MX-10][TER-NEW-P0-005][UNITARIA] valida ubicación completa, coordenadas y asiento para un recinto", async () => {
    const user = userEvent.setup(); render(<ElectoralLocationForm />); await user.click(screen.getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Debe seleccionar un asiento electoral")).toBeInTheDocument(); for (const [label, value] of [["Nombre del Recinto Electoral", "Recinto Central"], ["FID", "F-1"], ["Dirección", "Av. Central"], ["Código", "REC-01"], ["Distrito", "D-1"], ["Zona", "Centro"]] as const) await fill(user, label, value); await user.clear(screen.getByLabelText("Latitud")); await user.type(screen.getByLabelText("Latitud"), "-16.5"); await user.clear(screen.getByLabelText("Longitud")); await user.type(screen.getByLabelText("Longitud"), "-68.1"); await fullHierarchy(user); await user.click(screen.getByRole("button", { name: "Guardar" })); await waitFor(() => expect(harness.createLocation).toHaveBeenCalledWith(expect.objectContaining({ name: "Recinto Central", code: "REC-01", electoralSeatId: "seat-central", coordinates: { latitude: -16.5, longitude: -68.1 } })));
  });
  it("[MX-10][TER-NEW-P0-006][UNITARIA] exige número, código y recinto para una mesa", async () => {
    const user = userEvent.setup(); render(<ElectoralTableForm />); await user.click(screen.getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Debe seleccionar un recinto electoral")).toBeInTheDocument(); await fill(user, "Número de Mesa", "15"); await fill(user, "Código de Mesa", "LP-001-15"); await fullHierarchy(user, true); await user.click(screen.getByRole("button", { name: "Guardar" })); await waitFor(() => expect(harness.createTable).toHaveBeenCalledWith({ tableNumber: "15", tableCode: "LP-001-15", active: true, electoralLocationId: "loc-central" }));
  });
  it("[MX-10][TER-JER-P0-001][UNITARIA] bloquea y limpia selectores dependientes cuando cambia el nivel superior", async () => {
    const user = userEvent.setup(); render(<ElectoralTableForm />); expect(screen.getByRole("button", { name: "provinceId" })).toBeDisabled(); await fullHierarchy(user, true); expect(harness.getProvincesByDepartment).toHaveBeenCalledWith("dep-lp"); expect(harness.getMunicipalitiesByProvince).toHaveBeenCalledWith("prov-murillo"); expect(harness.getSeatsByMunicipality).toHaveBeenCalledWith("mun-lp"); expect(harness.getLocationsBySeat).toHaveBeenCalledWith("seat-central"); await select(user, "departmentId"); expect(screen.getByRole("button", { name: "provinceId" })).toHaveTextContent("Seleccionar provinceId"); expect(screen.getByRole("button", { name: "municipalityId" })).toHaveTextContent("Seleccionar municipalityId"); expect(screen.getByRole("button", { name: "electoralSeatId" })).toHaveTextContent("Seleccionar electoralSeatId");
  });
});
