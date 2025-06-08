import React, { useState } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useGetRecintosQuery,
  useDeleteRecintoMutation,
} from "../../store/recintos/recintosEndpoints";
import { RecintoElectoral } from "../../types/recintos";
import BackButton from "../../components/BackButton";

const columns: ColumnDef<RecintoElectoral>[] = [
  {
    accessorKey: "code",
    header: "Código",
  },
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "department",
    header: "Departamento",
  },
  {
    accessorKey: "municipality",
    header: "Municipio",
  },
  {
    accessorKey: "province",
    header: "Provincia",
  },
  {
    accessorKey: "totalTables",
    header: "Total Mesas",
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-sm ${
          row.original.active
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.active ? "Activo" : "Inactivo"}
      </span>
    ),
  },
];

const RecintosElectorales: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const { data } = useGetRecintosQuery({ page: currentPage, limit });
  const [deleteItem] = useDeleteRecintoMutation();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recintoToDelete, setRecintoToDelete] =
    useState<RecintoElectoral | null>(null);

  const handleEdit = (recinto: RecintoElectoral) => {
    navigate(`/recintos/editar/${recinto._id}`);
  };

  const handleDelete = (recinto: RecintoElectoral) => {
    setRecintoToDelete(recinto);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!recintoToDelete) return;

    deleteItem(recintoToDelete._id)
      .unwrap()
      .then(() => {
        console.log("Recinto deleted successfully");
        setIsDeleteModalOpen(false);
        setRecintoToDelete(null);
      })
      .catch((error) => {
        console.error("Failed to delete recinto:", error);
      });
  };

  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-400">
          <div className="flex items-center">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">
              Recintos Electorales
            </h1>
          </div>
          <Link
            to="/recintos/nuevo"
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
          >
            Nuevo Recinto
          </Link>
        </div>
        <div className="my-8">
          <Table
            data={data?.items || []}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
          >
            <Table.Header>
              <div className="flex justify-end mb-4">
                <input
                  type="text"
                  placeholder="Buscar recinto..."
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </Table.Header>
            <Table.Footer>
              {data && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={data.totalPages}
                  totalItems={data.total}
                  pageSize={limit}
                  onPageChange={setCurrentPage}
                />
              )}
            </Table.Footer>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRecintoToDelete(null);
        }}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro que deseas eliminar el recinto {recintoToDelete?.name}
            ?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setRecintoToDelete(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RecintosElectorales;
