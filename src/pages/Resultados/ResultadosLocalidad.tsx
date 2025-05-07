import { useState } from "react";
import Mapa from "../../components/Mapa";
import ResultsTable from "../../components/ResultsTable";

interface Department {
  code: string;
  name: string;
}

const resultsData = [
  { totalVotes: 87, ballotCount: 1, partyId: "MAS-IPSP", color: "#1a53ff" },
  { totalVotes: 33, ballotCount: 1, partyId: "C.C.", color: "#ffa300" },
  { totalVotes: 17, ballotCount: 1, partyId: "MTS", color: "#ebdc78" },
  { totalVotes: 3, ballotCount: 1, partyId: "FPV", color: "#b30000" },
  { totalVotes: 1, ballotCount: 1, partyId: "UCS", color: "#7c1158" },
  { totalVotes: 1, ballotCount: 1, partyId: "MNR", color: "#fdcce5" },
  { totalVotes: 12, ballotCount: 1, partyId: "PDC", color: "#ffee65" },
  { totalVotes: 23, ballotCount: 1, partyId: "PAN-BOL", color: "#87bc45" },
  { totalVotes: 16, ballotCount: 1, partyId: "21F", color: "#9b19f5" },
  { totalVotes: 33, ballotCount: 1, partyId: "otros", color: "#9b59f5" },
];

const ResultadosLocalidad = () => {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const handleDepartmentClick = (department: Department) => {
    console.log("Selected Department:", department);
    setSelectedDept(department);
    // You can add additional logic here if needed
  };

  return (
    <div className="map-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Mapa onDepartmentClick={handleDepartmentClick} />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-600">
              Tabla de Resultados {selectedDept ? `- ${selectedDept.name}` : ""}
            </h2>
          </div>
          <div className="p-6">
            <ResultsTable resultsData={resultsData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosLocalidad;
