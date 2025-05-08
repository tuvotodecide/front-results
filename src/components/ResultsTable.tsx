import React from "react";

interface GraphData {
  name: string;
  value: number;
  color: string;
}

interface ResultsTableProps {
  resultsData: GraphData[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ resultsData }) => {
  const total = resultsData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="w-full">
      <table className="w-full table-fixed divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-[45%] px-2 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Nombre
            </th>
            <th className="w-[25%] px-2 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Cant
            </th>
            <th className="w-[30%] px-2 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              %
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {resultsData.map((result) => (
            <tr key={result.name}>
              <td className="px-2 sm:px-4 py-2 border-x border-gray-200 truncate">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div
                    className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                    style={{ backgroundColor: result.color }}
                  ></div>
                  <span className="text-xs sm:text-sm truncate">
                    {result.name}
                  </span>
                </div>
              </td>
              <td className="px-2 sm:px-4 py-2 border-x border-gray-200 text-xs sm:text-sm">
                {result.value}
              </td>
              <td className="px-2 sm:px-4 py-2 border-x border-gray-200 text-xs sm:text-sm">
                {((result.value / total) * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
