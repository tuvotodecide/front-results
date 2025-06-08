// Table.tsx
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface TableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  children?: React.ReactNode;
}

// Sub-components for slots
const TableHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>;
};

const TableFooter = ({ children }: { children: React.ReactNode }) => {
  return <div className="mt-4">{children}</div>;
};

const TableComponent = <T extends object>({
  data,
  columns,
  onEdit,
  onDelete,
  children,
}: TableProps<T>) => {
  const columnsWithActions = React.useMemo(() => {
    if (!onEdit && !onDelete) return columns;

    const actionsColumn: ColumnDef<T> = {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(row.original)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row.original)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    };

    return [...columns, actionsColumn];
  }, [columns, onEdit, onDelete]);

  const table = useReactTable({
    data,
    columns: columnsWithActions,
    getCoreRowModel: getCoreRowModel(),
  });

  // Find header and footer children
  const headerChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === TableHeader
  );
  const footerChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === TableFooter
  );

  return (
    <div>
      {headerChild}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, i) => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300 border-r last:border-r-0 ${
                      i === 0 ? "border-l" : ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-100">
                {row.getVisibleCells().map((cell, i) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300 border-r last:border-r-0 ${
                      i === 0 ? "border-l" : ""
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footerChild}
    </div>
  );
};

// Create compound component
const Table = Object.assign(TableComponent, {
  Header: TableHeader,
  Footer: TableFooter,
});

export default Table;
