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

const formHarness = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: {} as Record<string, string>,
  createDepartment: vi.fn(),
  createProvince: vi.fn(),
  createMunicipality: vi.fn(),
  createSeat: vi.fn(),
  createLocation: vi.fn(),
  createTable: vi.fn(),
  getDepartments: vi.fn(),
  getProvincesByDepartment: vi.fn(),
  getMunicipalitiesByProvince: vi.fn(),
  getSeatsByMunicipality: vi.fn(),
  getLocationsBySeat: vi.fn(),
  mutation: (action: ReturnType<typeof vi.fn>) => () => [
    (input: unknown) => ({ unwrap: () => action(input) }),
    { isLoading: false, error: null },
  ],
  idleQuery: () => ({ data: undefined, isLoading: false }),
  lazy: (action: ReturnType<typeof vi.fn>) => () => [
    (input: unknown) => ({ unwrap: () => action(input) }),
  ],
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  useNavigate: () => formHarness.navigate,
  useParams: () => formHarness.params,
}));

vi.mock("@/components/LoadingButton", () => ({
  default: ({ children, isLoading: _isLoading, ...props }: { children: ReactNode; isLoading?: boolean }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/Modal", () => ({
  default: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div role="dialog" aria-label={title}>{title}</div> : null,
}));

vi.mock("@/domains/resultados/components/BackButton", () => ({
  default: () => <button type="button">Volver</button>,
}));

vi.mock("react-select/async", () => ({
  default: ({
    isDisabled,
    loadOptions,
    name,
    onChange,
    value,
  }: {
    isDisabled?: boolean;
    loadOptions?: (input: string) => Promise<unknown>;
    name: string;
    onChange: (option: { value: string; label: string }) => void;
    value?: { label: string } | null;
  }) => {
    const option = {
      departmentId: { value: "dep-lp", label: "La Paz" },
      provinceId: { value: "prov-murillo", label: "Murillo" },
      municipalityId: { value: "mun-lp", label: "La Paz" },
      electoralSeatId: { value: "seat-central", label: "Central" },
      electoralLocationId: { value: "loc-central", label: "Recinto Central" },
    }[name];

    if (!option) {
      return <button aria-label={name} disabled type="button">{value?.label ?? `Seleccionar ${name}`}</button>;
    }

    return (
      <button
        aria-label={name}
        disabled={isDisabled}
        type="button"
        onClick={async () => {
          await loadOptions?.("");
          onChange(option);
        }}
      >
        {value?.label ?? `Seleccionar ${name}`}
      </button>
    );
  },
}));

vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useCreateDepartmentMutation: formHarness.mutation(formHarness.createDepartment),
  useUpdateDepartmentMutation: formHarness.mutation(vi.fn()),
  useGetDepartmentQuery: formHarness.idleQuery,
  useLazyGetDepartmentsQuery: formHarness.lazy(formHarness.getDepartments),
}));
vi.mock("@/store/provinces/provincesEndpoints", () => ({
  useCreateProvinceMutation: formHarness.mutation(formHarness.createProvince),
  useUpdateProvinceMutation: formHarness.mutation(vi.fn()),
  useGetProvinceQuery: formHarness.idleQuery,
  useLazyGetProvincesQuery: formHarness.lazy(vi.fn()),
  useLazyGetProvincesByDepartmentIdQuery: formHarness.lazy(formHarness.getProvincesByDepartment),
}));
vi.mock("@/store/municipalities/municipalitiesEndpoints", () => ({
  useCreateMunicipalityMutation: formHarness.mutation(formHarness.createMunicipality),
  useUpdateMunicipalityMutation: formHarness.mutation(vi.fn()),
  useGetMunicipalityQuery: formHarness.idleQuery,
  useLazyGetMunicipalitiesQuery: formHarness.lazy(vi.fn()),
  useLazyGetMunicipalitiesByProvinceIdQuery: formHarness.lazy(formHarness.getMunicipalitiesByProvince),
}));
vi.mock("@/store/electoralSeats/electoralSeatsEndpoints", () => ({
  useCreateElectoralSeatMutation: formHarness.mutation(formHarness.createSeat),
  useUpdateElectoralSeatMutation: formHarness.mutation(vi.fn()),
  useGetElectoralSeatQuery: formHarness.idleQuery,
  useLazyGetElectoralSeatsByMunicipalityIdQuery: formHarness.lazy(formHarness.getSeatsByMunicipality),
}));
vi.mock("@/store/electoralLocations/electoralLocationsEndpoints", () => ({
  useCreateElectoralLocationMutation: formHarness.mutation(formHarness.createLocation),
  useUpdateElectoralLocationMutation: formHarness.mutation(vi.fn()),
  useGetElectoralLocationQuery: formHarness.idleQuery,
  useLazyGetElectoralLocationsByElectoralSeatIdQuery: formHarness.lazy(formHarness.getLocationsBySeat),
}));
vi.mock("@/store/electoralTables/electoralTablesEndpoints", () => ({
  useCreateElectoralTableMutation: formHarness.mutation(formHarness.createTable),
  useUpdateElectoralTableMutation: formHarness.mutation(vi.fn()),
  useGetElectoralTableQuery: formHarness.idleQuery,
}));

const fill = async (user: ReturnType<typeof userEvent.setup>, label: string, value: string) => {
  await user.type(screen.getByLabelText(label), value);
};

const select = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole("button", { name }));
};

const selectFullHierarchy = async (user: ReturnType<typeof userEvent.setup>, includeLocation = false) => {
  await select(user, "departmentId");
  await select(user, "provinceId");
  await select(user, "municipalityId");
  await select(user, "electoralSeatId");
  if (includeLocation) await select(user, "electoralLocationId");
};

const selectThroughMunicipality = async (user: ReturnType<typeof userEvent.setup>) => {
  await select(user, "departmentId");
  await select(user, "provinceId");
  await select(user, "municipalityId");
};

describe("MX-10 | formularios territoriales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formHarness.params = {};
    for (const action of [
      formHarness.createDepartment,
      formHarness.createProvince,
      formHarness.createMunicipality,
      formHarness.createSeat,
      formHarness.createLocation,
      formHarness.createTable,
    ]) action.mockResolvedValue(undefined);
    formHarness.getDepartments.mockResolvedValue({ data: [{ _id: "dep-lp", name: "La Paz" }] });
    formHarness.getProvincesByDepartment.mockResolvedValue([{ _id: "prov-murillo", name: "Murillo" }]);
    formHarness.getMunicipalitiesByProvince.mockResolvedValue([{ _id: "mun-lp", name: "La Paz" }]);
    formHarness.getSeatsByMunicipality.mockResolvedValue([{ _id: "seat-central", name: "Central" }]);
    formHarness.getLocationsBySeat.mockResolvedValue([{ _id: "loc-central", name: "Recinto Central" }]);
  });

  afterEach(() => cleanup());

  it("[MX-10][TER-NEW-P0-001][INTEGRACION] guarda el departamento y vuelve a su listado", async () => {
    const user = userEvent.setup();
    render(<DepartmentForm />);
    await fill(user, "Nombre del Departamento", "Cochabamba");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(formHarness.navigate).toHaveBeenCalledWith("/resultados/departamentos"));
    expect(screen.getByRole("dialog", { name: "Exito" })).toBeInTheDocument();
  });

  it("[MX-10][TER-NEW-P0-002][INTEGRACION] busca el departamento y conserva el formulario cuando falla el guardado", async () => {
    const user = userEvent.setup();
    formHarness.createProvince.mockRejectedValueOnce(new Error("duplicada"));
    render(<ProvinceForm />);
    await fill(user, "Nombre de la Provincia", "Murillo");
    await select(user, "departmentId");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(formHarness.createProvince).toHaveBeenCalled());
    expect(screen.getByLabelText("Nombre de la Provincia")).toHaveValue("Murillo");
    expect(formHarness.navigate).not.toHaveBeenCalled();
  });

  it("[MX-10][TER-NEW-P0-003][INTEGRACION] carga provincias dependientes, guarda municipio y vuelve al listado", async () => {
    const user = userEvent.setup();
    render(<MunicipalityForm />);
    await fill(user, "Nombre del Municipio", "La Paz");
    await select(user, "departmentId");
    await select(user, "provinceId");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(formHarness.navigate).toHaveBeenCalledWith("/resultados/municipios"));
    expect(formHarness.getProvincesByDepartment).toHaveBeenCalledWith("dep-lp");
  });

  it("[MX-10][TER-NEW-P0-004][INTEGRACION] selecciona la jerarquía para guardar un asiento electoral", async () => {
    const user = userEvent.setup();
    render(<ElectoralSeatForm />);
    await fill(user, "Nombre del Asiento Electoral", "Central");
    await fill(user, "ID Localización", "LP-01");
    await selectThroughMunicipality(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(formHarness.navigate).toHaveBeenCalledWith("/resultados/asientos-electorales"));
  });

  it("[MX-10][TER-NEW-P0-005][INTEGRACION] conserva los datos del recinto tras un error recuperable", async () => {
    const user = userEvent.setup();
    formHarness.createLocation.mockRejectedValueOnce(new Error("duplicado"));
    render(<ElectoralLocationForm />);
    await fill(user, "Nombre del Recinto Electoral", "Recinto Central");
    await fill(user, "FID", "F-1");
    await fill(user, "Dirección", "Av. Central");
    await fill(user, "Código", "REC-01");
    await fill(user, "Distrito", "D-1");
    await fill(user, "Zona", "Centro");
    await user.clear(screen.getByLabelText("Latitud"));
    await user.type(screen.getByLabelText("Latitud"), "-16.5");
    await user.clear(screen.getByLabelText("Longitud"));
    await user.type(screen.getByLabelText("Longitud"), "-68.1");
    await selectFullHierarchy(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(formHarness.createLocation).toHaveBeenCalled());
    expect(screen.getByLabelText("Nombre del Recinto Electoral")).toHaveValue("Recinto Central");
    expect(formHarness.navigate).not.toHaveBeenCalled();
  });

  it("[MX-10][TER-NEW-P0-006][INTEGRACION] carga la jerarquía hasta recinto y guarda una mesa", async () => {
    const user = userEvent.setup();
    render(<ElectoralTableForm />);
    await fill(user, "Número de Mesa", "15");
    await fill(user, "Código de Mesa", "LP-001-15");
    await selectFullHierarchy(user, true);
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(formHarness.navigate).toHaveBeenCalledWith("/resultados/mesas"));
    expect(formHarness.getLocationsBySeat).toHaveBeenCalledWith("seat-central");
  });
});
