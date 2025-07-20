import React from 'react';

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
            <th className="w-[45%] px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Candidato / Partido
            </th>
            <th className="w-[25%] px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Votos
            </th>
            <th className="w-[30%] px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Porcentaje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {resultsData.map((result) => (
            <tr key={result.name}>
              <td className="px-4 sm:px-6 py-4 border-x border-gray-200 truncate">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                    style={{ backgroundColor: result.color }}
                  ></div>
                  <span className="text-sm sm:text-base truncate">
                    {result.name}
                  </span>
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 border-x border-gray-200 text-sm sm:text-base text-right tabular-nums">
                {result.value.toLocaleString()}
              </td>
              <td className="px-4 sm:px-6 py-4 border-x border-gray-200 text-sm sm:text-base text-right tabular-nums">
                <span className="inline-block min-w-[60px]">
                  {((result.value / total) * 100).toFixed(2)} %
                </span>
              </td>
            </tr>
          ))}
          {/* Total row */}
          <tr className="bg-gray-100 font-semibold">
            <td className="px-4 sm:px-6 py-4 border-x border-gray-200 text-sm sm:text-base">
              TOTAL
            </td>
            <td className="px-4 sm:px-6 py-4 border-x border-gray-200 text-sm sm:text-base text-right tabular-nums">
              {total.toLocaleString()}
            </td>
            <td className="px-4 sm:px-6 py-4 border-x border-gray-200 text-sm sm:text-base text-right tabular-nums">
              <span className="inline-block min-w-[60px]">100 %</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
