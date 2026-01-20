import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { useSelector } from "react-redux";
import { selectDepartments } from "../store/departments/departmentsSlice";
import { useLazyGetProvincesByDepartmentIdQuery } from "../store/provinces/provincesEndpoints";
import { useLazyGetMunicipalitiesByProvinceIdQuery } from "../store/municipalities/municipalitiesEndpoints";

type Mode = "GOVERNOR" | "MAYOR";
type LevelOption = { _id: string; name: string };

type Props = {
  mode: Mode;
  value: {
    departmentId: string;
    provinceId: string;
    municipalityId: string;
  };
  onChange: (next: {
    departmentId?: string;
    provinceId?: string;
    municipalityId?: string;
  }) => void;
};

export default function ScopePicker({ mode, value, onChange }: Props) {
  const departmentsRaw = useSelector(selectDepartments) as any[];
  const departments: LevelOption[] = useMemo(
    () => (departmentsRaw || []).map((d) => ({ _id: d._id, name: d.name })),
    [departmentsRaw],
  );

  const [getProvincesByDepartmentId] = useLazyGetProvincesByDepartmentIdQuery();
  const [getMunicipalitiesByProvinceId] =
    useLazyGetMunicipalitiesByProvinceIdQuery();

  const [provinces, setProvinces] = useState<LevelOption[]>([]);
  const [municipalities, setMunicipalities] = useState<LevelOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const currentList: LevelOption[] = useMemo(() => {
    if (mode === "GOVERNOR") return departments;

    // MAYOR flow
    if (!value.departmentId) return departments;
    if (!value.provinceId) return provinces;
    return municipalities;
  }, [
    mode,
    departments,
    provinces,
    municipalities,
    value.departmentId,
    value.provinceId,
  ]);

  const fuse = useMemo(() => {
    return new Fuse(currentList, { keys: ["name"], threshold: 0.35 });
  }, [currentList]);

  const filtered = useMemo(() => {
    if (!search.trim()) return currentList;
    return fuse.search(search.trim()).map((r) => r.item);
  }, [search, fuse, currentList]);

  const title = useMemo(() => {
    if (mode === "GOVERNOR") return "Seleccione su Departamento";
    if (!value.departmentId) return "Seleccione Departamento";
    if (!value.provinceId) return "Seleccione Provincia";
    return "Seleccione Municipio";
  }, [mode, value.departmentId, value.provinceId]);

  const helper = useMemo(() => {
    if (mode === "GOVERNOR")
      return "Tu acceso quedará restringido al departamento seleccionado.";
    return "Tu acceso quedará restringido al municipio seleccionado.";
  }, [mode]);

  // Load provinces when department picked (MAYOR)
  useEffect(() => {
    const load = async () => {
      if (mode !== "MAYOR") return;
      if (!value.departmentId) {
        setProvinces([]);
        setMunicipalities([]);
        return;
      }
      setLoading(true);
      try {
        const resp = await getProvincesByDepartmentId(
          value.departmentId,
        ).unwrap();
        setProvinces(resp);
        setMunicipalities([]);
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {});
  }, [mode, value.departmentId]);

  // Load municipalities when province picked (MAYOR)
  useEffect(() => {
    const load = async () => {
      if (mode !== "MAYOR") return;
      if (!value.provinceId) {
        setMunicipalities([]);
        return;
      }
      setLoading(true);
      try {
        const resp = await getMunicipalitiesByProvinceId(
          value.provinceId,
        ).unwrap();
        setMunicipalities(resp);
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {});
  }, [mode, value.provinceId]);

  const onPick = (opt: LevelOption) => {
    setSearch("");

    if (mode === "GOVERNOR") {
      onChange({ departmentId: opt._id, provinceId: "", municipalityId: "" });
      return;
    }

    // MAYOR
    if (!value.departmentId) {
      onChange({ departmentId: opt._id, provinceId: "", municipalityId: "" });
      return;
    }

    if (!value.provinceId) {
      onChange({
        departmentId: value.departmentId,
        provinceId: opt._id,
        municipalityId: "",
      });
      return;
    }

    onChange({
      departmentId: value.departmentId,
      provinceId: value.provinceId,
      municipalityId: opt._id,
    });
  };

  const getNameById = (list: LevelOption[], id?: string) =>
    (id && list.find((x) => x._id === id)?.name) || "—";

  const selectedDepartmentName = useMemo(
    () => getNameById(departments, value.departmentId),
    [departments, value.departmentId],
  );

  const selectedProvinceName = useMemo(
    () => getNameById(provinces, value.provinceId),
    [provinces, value.provinceId],
  );

  const selectedMunicipalityName = useMemo(
    () => getNameById(municipalities, value.municipalityId),
    [municipalities, value.municipalityId],
  );

  const canBack = mode === "MAYOR" && (value.departmentId || value.provinceId);
  const back = () => {
    setSearch("");
    if (mode !== "MAYOR") return;

    if (value.provinceId) {
      onChange({
        departmentId: value.departmentId,
        provinceId: "",
        municipalityId: "",
      });
      return;
    }
    onChange({ departmentId: "", provinceId: "", municipalityId: "" });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 mt-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{helper}</p>
        </div>

        {canBack && (
          <button
            type="button"
            onClick={back}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Volver
          </button>
        )}
      </div>
      <div className="mt-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#459151]"
        />
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#459151]"></div>
              <span className="text-gray-600 font-medium">
                Cargando opciones...
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filtered.map((o) => (
              <button
                type="button"
                key={o._id}
                onClick={() => onPick(o)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition"
              >
                <div className="text-sm font-medium text-gray-800">
                  {o.name}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 py-6 col-span-full">
                Sin resultados
              </div>
            )}
          </div>
        )}
      </div>
      Resumen simple
      <div className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="font-semibold mb-1">Resumen</div>
        {mode === "GOVERNOR" ? (
          <div>
            Departamento:{" "}
            <span className="font-semibold text-gray-900">
              {selectedDepartmentName}
            </span>
          </div>
        ) : (
          <div>
            Departamento:{" "}
            <span className="font-semibold text-gray-900">
              {selectedDepartmentName}
            </span>{" "}
            · Provincia:{" "}
            <span className="font-semibold text-gray-900">
              {selectedProvinceName}
            </span>{" "}
            · Municipio:{" "}
            <span className="font-semibold text-gray-900">
              {selectedMunicipalityName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
