import React from "react";

interface ResultData {
  totalVotes: number;
  ballotCount: number;
  partyId: string;
  color: string;
}

interface ResultsTableProps {
  resultsData: ResultData[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ resultsData }) => {
  const totalVotes = resultsData.reduce(
    (acc, party) => acc + party.totalVotes,
    0
  );

  return (
    <div className="w-full">
      <table className="w-full table-fixed divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-[45%] px-2 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Partido
            </th>
            <th className="w-[25%] px-2 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Votos
            </th>
            <th className="w-[30%] px-2 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              %
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {resultsData
            .sort((a, b) => b.totalVotes - a.totalVotes)
            .map((party) => (
              <tr key={party.partyId}>
                <td className="px-2 sm:px-4 py-2 border-x border-gray-200 truncate">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div
                      className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                      style={{ backgroundColor: party.color }}
                    ></div>
                    <span className="text-xs sm:text-sm truncate">
                      {party.partyId}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 border-x border-gray-200 text-xs sm:text-sm">
                  {party.totalVotes}
                </td>
                <td className="px-2 sm:px-4 py-2 border-x border-gray-200 text-xs sm:text-sm">
                  {((party.totalVotes / totalVotes) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
