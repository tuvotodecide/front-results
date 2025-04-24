import React, { use, useEffect } from "react";
import Table from "../../components/Table";
import {
  useGetRecintosQuery,
  useDeleteRecintoMutation,
} from "../../store/recintos/recintosEndpoints";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { useGetPartidosQuery } from "../../store/partidos/partidosEndpoints";

const data = [
  { id: 1, name: "Juan", age: 28, email: "juan@email.com" },
  { id: 2, name: "Ana", age: 34, email: "ana@email.com" },
  { id: 3, name: "Luis", age: 22, email: "luis@email.com" },
];

const columns: ColumnDef<(typeof data)[0]>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "age", header: "Edad" },
  { accessorKey: "email", header: "Email" },
];

const Partidos: React.FC = () => {
  const { data: items } = useGetPartidosQuery();
  useEffect(() => {
    console.log("dataaa", items);
  }, [items]);
  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full max-w-4xl p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            Partidos politicos
          </h1>
          <Link
            to="/partidos/nuevo"
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
          >
            Nuevo Partido
          </Link>
        </div>
        <div className="my-8">
          <Table data={data} columns={columns} />
        </div>
      </div>
    </div>
  );
};

export default Partidos;
