import React, { useEffect, useState } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import SearchForm from "../../components/SearchForm";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import BackButton from "../../components/BackButton";
import {
  useGetMunicipalitiesQuery,
  useDeleteMunicipalityMutation,
} from "../../store/municipalities/municipalitiesEndpoints";
import { MunicipalitiesType } from "../../types";

const columns: ColumnDef<MunicipalitiesType>[] = [
  {
    accessorKey: "department",
    header: "Departamento",
    cell: ({ row }) => row.original.provinceId?.departmentId?.name,
  },
  {
    accessorKey: "province",
    header: "Provincia",
    cell: ({ row }) => row.original.provinceId?.name,
  },
  {
    accessorKey: "name",
    header: "Nombre",
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

const Municipalities: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});
  const limit = 10;
  const { data } = useGetMunicipalitiesQuery({
    page: currentPage,
    limit,
    ...searchParams,
  });

  const items = data?.data || [];
  const pagination = data?.pagination;
  const [deleteItem] = useDeleteMunicipalityMutation();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MunicipalitiesType | null>(
    null
  );

  const handleEdit = (municipality: MunicipalitiesType) => {
    navigate(`/municipios/editar/${municipality._id}`);
  };

  const handleDelete = (item: MunicipalitiesType) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    deleteItem(itemToDelete._id)
      .unwrap()
      .then(() => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      })
      .catch((error: any) => {
        console.error("Failed to delete item:", error);
      });
  };

  const handleSearch = (values: Record<string, string>) => {
    setSearchParams(values);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Log municipalities whenever they change
  useEffect(() => {
    if (data) {
      console.log("respp respp respp:", data);
    }
  }, [data]);

  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-400">
          <div className="flex items-center">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">Municipios</h1>
          </div>
          <Link
            to="/municipios/nuevo"
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
          >
            Nuevo Item
          </Link>
        </div>
        <div className="my-8">
          <Table
            data={items || []}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
          >
            <Table.Header>
              <div className="mb-4">
                <SearchForm onSearch={handleSearch} department province />
              </div>
            </Table.Header>
            <Table.Footer>
              {data && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination?.pages || 0}
                  totalItems={pagination?.total || 0}
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
          setItemToDelete(null);
        }}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro que deseas eliminar el item {itemToDelete?.name}?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
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

export default Municipalities;
