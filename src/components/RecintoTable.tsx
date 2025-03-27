import { RecintoElectoral } from "../types/recintos";

interface RecintoTableProps {
  data?: RecintoElectoral[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const RecintoTable = ({ data, onEdit, onDelete }: RecintoTableProps) => {
  return (
    <table className="min-w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">Código</th>
          <th className="border p-2">Departamento</th>
          <th className="border p-2">Municipio</th>
          <th className="border p-2">Provincia</th>
          <th className="border p-2">Mesas</th>
          <th className="border p-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data &&
          data.map((recinto) => (
            <tr key={recinto.code}>
              <td className="border p-2">{recinto.code}</td>
              <td className="border p-2">{recinto.department}</td>
              <td className="border p-2">{recinto.municipality}</td>
              <td className="border p-2">{recinto.province}</td>
              <td className="border p-2">{recinto.totalTables}</td>
              <td className="border p-2">
                <button
                  onClick={() => onEdit?.(recinto._id)}
                  className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete?.(recinto._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};
