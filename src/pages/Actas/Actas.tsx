import React, { useEffect } from "react";
import Table from "../../components/Table";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { useGetBallotsQuery } from "../../store/actas/actasEndpoints";
import { Ballot } from "../../types/ballot";
import BackButton from "../../components/BackButton";

const columns: ColumnDef<Ballot>[] = [
  // {
  //   accessorKey: "locationCode",
  //   header: "Código de Ubicación",
  // },
  {
    accessorKey: "trackingId",
    header: "ID de Seguimiento",
  },
  {
    accessorKey: "tableNumber",
    header: "Número de Mesa",
  },
  // {
  //   accessorKey: "citizenId",
  //   header: "ID Ciudadano",
  // },
  {
    accessorKey: "status",
    header: "Estatus",
  },
  {
    accessorKey: "file",
    header: "Archivo",
    cell: ({ row }) => (
      <span className="text-blue-600 hover:text-blue-800">
        {row.original.file ? "Ver archivo" : "No disponible"}
      </span>
    ),
  },
];

const Actas: React.FC = () => {
  const { data } = useGetBallotsQuery();
  const items = data?.ballots || [];
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Items:", items);
  }, [items]);

  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-400">
          <div className="flex items-center">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">
              Actas de Votación
            </h1>
          </div>

          <Link
            to="/actas/nuevo"
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
          >
            Nueva Acta
          </Link>
        </div>
        <div className="my-8">
          <Table data={items} columns={columns} />
        </div>
      </div>
    </div>
  );
};

export default Actas;
