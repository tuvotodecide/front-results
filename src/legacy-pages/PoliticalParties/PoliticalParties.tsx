import React, { useState } from 'react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { Link, useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import BackButton from '../../components/BackButton';
import {
  useDeletePoliticalPartyMutation,
  useGetPoliticalPartiesQuery,
} from '../../store/politicalParties/politicalPartiesEndpoints';
import { PoliticalPartiesType } from '../../types';

const columns: ColumnDef<PoliticalPartiesType>[] = [
  {
    accessorKey: 'partyId',
    header: 'Identificador',
  },
  {
    accessorKey: 'fullName',
    header: 'Nombre Completo',
  },
  {
    accessorKey: 'shortName',
    header: 'Sigla',
  },
  {
    id: 'logo',
    header: 'Logo',
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
    id: 'color',
    header: 'Color',
    cell: ({ row }) => (
      <div
        className="w-6 h-6 rounded-full"
        style={{ backgroundColor: row.original.color }}
      />
    ),
  },
  {
    id: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-sm ${
          row.original.active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {row.original.active ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

const PoliticalParties: React.FC = () => {
  const { data: items = [] } = useGetPoliticalPartiesQuery();
  const [deleteItem] = useDeletePoliticalPartyMutation();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [partidoToDelete, setPartidoToDelete] =
    useState<PoliticalPartiesType | null>(null);

  const handleEdit = (partido: PoliticalPartiesType) => {
    navigate(`/partidos-politicos/editar/${partido._id}`);
  };

  const handleDelete = (partido: PoliticalPartiesType) => {
    setPartidoToDelete(partido);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!partidoToDelete) return;

    deleteItem(partidoToDelete._id)
      .unwrap()
      .then(() => {
        setIsDeleteModalOpen(false);
        setPartidoToDelete(null);
      })
      .catch((error) => {
        console.error('Failed to delete partido:', error);
      });
  };

  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-400">
          <div className="flex items-center">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">
              Partidos Políticos
            </h1>
          </div>

          <Link
            to="/partidos-politicos/nuevo"
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPartidoToDelete(null);
        }}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro que deseas eliminar el partido{' '}
            {partidoToDelete?.fullName}?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setPartidoToDelete(null);
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

export default PoliticalParties;
