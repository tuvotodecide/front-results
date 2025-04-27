import React, { useState } from "react";
import { Link } from "react-router-dom";
import Table from "../components/Table";
import Modal from "../components/Modal";
import type { ColumnDef } from "@tanstack/react-table";

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

const Home: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/resultados"
            className="text-blue-600 hover:text-blue-700 mr-4"
          >
            Resultados
          </Link>
          <Link to="/enviarActa" className="text-blue-600 hover:text-blue-700">
            Enviar acta
          </Link>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Abrir Modal
        </button>
      </div>

      <div className="my-8">
        <Table data={data} columns={columns} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Mi Modal"
      >
        <div className="text-gray-600">
          <p className="mb-4">
            Este es un ejemplo de modal que se puede cerrar haciendo click en el
            botón X o en el fondo oscuro.
          </p>
          <p>
            El modal utiliza el elemento nativo dialog de HTML para mejor
            accesibilidad y comportamiento nativo.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
