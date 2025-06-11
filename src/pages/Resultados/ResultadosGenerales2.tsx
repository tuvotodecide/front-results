import { use, useEffect, useMemo, useState } from "react";
import Mapa from "../../components/Mapa";
import BarChart from "../../components/BarChart";
import D3PieChart from "../../components/D3PieChart";
import ResultsTable from "../../components/ResultsTable";
import { useGetResultsQuery } from "../../store/resultados/resultadosEndpoints";
import { useGetPartidosQuery } from "../../store/partidos/partidosEndpoints";
import { departamentos, provincias, municipios } from "./datos";
import { Breadcrumb } from "../../components/Breadcrumb";
import {
  useGetDepartmentsQuery,
  useLazyGetMunicipalitiesQuery,
  useLazyGetProvincesQuery,
} from "../../store/recintos/recintosEndpoints";

interface Department {
  code: string;
  name: string;
}

const ResultadosLocalidad = () => {
  // const [resultsData, setResultsData] = useState([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    department: string | null;
    province: string | null;
    municipality: string | null;
  }>({
    department: null,
    province: null,
    municipality: null,
  });
  const [activeTab, setActiveTab] = useState("bars");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const { data: { results = [] } = {} } = useGetResultsQuery({
    department: selectedLocation.department || undefined,
  });
  const { data: items = [] } = useGetPartidosQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [getProvinces] = useLazyGetProvincesQuery();
  const [getMunicipalities] = useLazyGetMunicipalitiesQuery();

  useEffect(() => {
    console.log("Selected Department:", departments);
  }, [departments]);

  // useEffect(() => {
  //   if (results.length && items.length) {
  //     const combinedData = results.map((result) => {
  //       const matchingParty = items.find(
  //         (item) => item.partyId === result.partyId
  //       );
  //       return {
  //         name: result.partyId,
  //         value: result.totalVotes,
  //         color: matchingParty?.color || "#000000", // fallback color if no match found
  //       };
  //     });
  //     setResultsData(combinedData);
  //   } else {
  //     setResultsData([]);
  //   }
  // }, [results, items]);

  const combinedData = useMemo(() => {
    if (!results?.length || !items?.length) return [];

    return results.map((result) => {
      const matchingParty = items.find(
        (item) => item.partyId === result.partyId
      );
      return {
        name: result.partyId,
        value: result.totalVotes,
        color: matchingParty?.color || "#000000",
      };
    });
  }, [results, items]);

  const handleDepartmentClick = (department: Department) => {
    // console.log("Selected Department:", department);
    //setSelectedDept(department);
    console.log("Selected Department:", department);
  };

  const handleSelectionChange = (selection: {
    department: string | null;
    province: string | null;
    municipality: string | null;
  }) => {
    console.log("Selection changed:", selection);
    // setSelectedLocation({
    //   department: selection.departamento,
    //   province: selection.provincia,
    //   municipality: selection.municipio,
    // });
    if (
      selection.department &&
      selection.department !== selectedLocation.department
    ) {
      console.log("calling getProvinces with:", selection.department);
      getProvinces(selection.department).then((response) => {
        setProvinces(response.data ?? []);
      });
      setSelectedLocation({
        department: selection.department,
        province: null,
        municipality: null,
      });
    } else if (
      selection.department &&
      selection.province &&
      selection.province !== selectedLocation.province
    ) {
      console.log("calling getMunicipalities with:", {
        department: selection.department,
        province: selection.province,
      });
      getMunicipalities({
        department: selection.department,
        province: selection.province,
      }).then((response) => {
        setMunicipalities(response.data ?? []);
      });
      setSelectedLocation({
        department: selection.department,
        province: selection.province,
        municipality: null,
      });
    } else if (selection.department === null) {
      setSelectedLocation({
        department: null,
        province: null,
        municipality: null,
      });
    }

    // if (selection.departamento) {
    //   setSelectedDept(selection.departamento);
    //   getProvinces(selection.departamento).then((response) => {
    //     const formatedProvinces = (response.data ?? []).map((prov) => ({
    //       value: prov,
    //       name: prov,
    //     }));
    //     setProvinces(formatedProvinces);
    //   });
    // }
    // if (selection.province) {
    //   getMunicipalities(selection.province).then((response) => {
    //     setMunicipalities(response.data || []);
    //   });
    // }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados Generales
        </h1>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div>
            <Breadcrumb
              departments={departments}
              provinces={provinces}
              municipalities={municipalities}
              onSelectionChange={(selection) => {
                console.log("Parent received selection:", selection);
                handleSelectionChange(selection);
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <Mapa onDepartmentClick={handleDepartmentClick} />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-600">
                  Visualización de Resultados{" "}
                  {/* {selectedDept ? `- ${selectedDept.name}` : ""} */}
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4 border-b border-gray-200">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("bars")}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === "bars"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Gráfico de Barras
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pie")}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === "pie"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Gráfico Circular
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("table")}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === "table"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Tabla
                    </button>
                  </div>
                </div>
                {activeTab === "bars" && <BarChart data={combinedData} />}
                {activeTab === "pie" && <D3PieChart data={combinedData} />}
                {activeTab === "table" && (
                  <ResultsTable resultsData={combinedData} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosLocalidad;
