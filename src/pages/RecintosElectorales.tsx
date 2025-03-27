import React, { useEffect } from "react";
import {
  useGetRecintosQuery,
  useDeleteRecintoMutation,
} from "../store/recintos/recintosEndpoints";
import { RecintoTable } from "../components/RecintoTable";
import { useNavigate } from "react-router-dom";

const RecintosElectorales: React.FC = () => {
  const { data } = useGetRecintosQuery();
  const [deleteRecinto] = useDeleteRecintoMutation();
  const navigate = useNavigate();
  useEffect(() => {
    console.log("dataaa", data);
  }, [data]);

  const handleAddRecinto = () => {
    navigate("/recintos/nuevo");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecinto(id);
    } catch (error) {
      console.error("Error deleting recinto:", error);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/recintos/editar/${id}`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">
            Recintos Electorales
          </h1>
          <button
            onClick={handleAddRecinto}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Agregar Recinto
          </button>
        </div>
        <RecintoTable data={data} onDelete={handleDelete} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default RecintosElectorales;
