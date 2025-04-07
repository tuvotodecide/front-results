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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Partido
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Votos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">
              Porcentaje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {resultsData
            .sort((a, b) => b.totalVotes - a.totalVotes)
            .map((party) => (
              <tr key={party.partyId}>
                <td className="px-6 py-4 whitespace-nowrap border-x border-gray-200">
                  <div className="flex items-center">
                    <div
                      className="h-4 w-4 mr-2"
                      style={{ backgroundColor: party.color }}
                    ></div>
                    {party.partyId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap border-x border-gray-200">
                  {party.totalVotes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap border-x border-gray-200">
                  {((party.totalVotes / totalVotes) * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
