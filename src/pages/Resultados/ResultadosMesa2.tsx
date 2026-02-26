import { useParams } from "react-router-dom";
import TableSearchMode from "./TableSearchMode";
import TableDetailsMode from "./TableDetailsMode";

const ResultadosMesa2 = () => {
  const { tableCode } = useParams();

  return (
    <div className="outer-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Mesa
        </h1>

        {!tableCode ? (
          <TableSearchMode />
        ) : (
          <TableDetailsMode tableCode={tableCode} />
        )}
      </div>
    </div>
  );
};

export default ResultadosMesa2;
