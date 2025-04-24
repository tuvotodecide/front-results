import React from "react";
import Table from "../../components/Table";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { useGetPartidosQuery } from "../../store/partidos/partidosEndpoints";
import { Partido } from "../../types/partidos";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const columns: ColumnDef<Partido>[] = [
  {
    accessorKey: "partyId",
    header: "Sigla",
  },
  {
    accessorKey: "fullName",
    header: "Nombre Completo",
  },
  {
    accessorKey: "legalRepresentative",
    header: "Representante Legal",
  },
  {
    id: "logo",
    header: "Logo",
    cell: ({ row }) =>
      row.original.logoUrl ? (
        // <img
        //   src={row.original.logoUrl}
        //   alt="Logo"
        //   className="w-10 h-10 object-contain"
        // />
        <></>
      ) : null,
  },
  {
    id: "color",
    header: "Color",
    cell: ({ row }) => (
      <div
        className="w-6 h-6 rounded-full"
        style={{ backgroundColor: row.original.color }}
      />
    ),
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
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/partidos/editar/${row.original.partyId}`)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              // Add delete handler here
              console.log("Delete", row.original.partyId);
            }}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      );
    },
  },
];

const Partidos: React.FC = () => {
  const { data: items = [] } = useGetPartidosQuery();
  const navigate = useNavigate();

  const handleEdit = (partido: Partido) => {
    navigate(`/partidos/editar/${partido.partyId}`);
  };

  const handleDelete = (partido: Partido) => {
    // TODO: Implement delete functionality
    console.log("Delete partido:", partido.partyId);
  };

  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            Partidos Políticos
          </h1>
          <Link
            to="/partidos/nuevo"
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
          >
            Nuevo Partido
          </Link>
        </div>
        <div className="my-8">
          <Table
            data={items}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default Partidos;
