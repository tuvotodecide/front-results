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
  const safeNumber = (n: any) => {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
  };
  const totalVotes = resultsData.reduce(
    (sum, row) => sum + safeNumber(row.value),
    0
  );

  const percent = (value: any) => {
    const v = safeNumber(value);
    if (totalVotes <= 0) return 0;
    return (v / totalVotes) * 100;
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm overflow-x-auto">
      <table className="table-fixed w-full min-w-[320px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="w-[40%] px-6 py-4 text-left text-sm font-semibold text-slate-700 tracking-wide">
              Partido
            </th>
            <th className="w-[30%] px-6 py-4 text-right text-sm font-semibold text-slate-700 tracking-wide">
              Votos
            </th>
            <th className="w-[30%] px-6 py-4 text-right text-sm font-semibold text-slate-700 tracking-wide">
              Porcentaje
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {resultsData.map((result) => (
            <tr
              key={result.name}
              className="group transition-colors duration-150 hover:bg-slate-50/60"
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="h-3 w-3 rounded-sm shadow-sm border border-slate-200/50 flex-shrink-0"
                    style={{ backgroundColor: result.color }}
                  ></div>
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {result.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-base text-slate-900 text-right tabular-nums font-semibold">
                {result.value?.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-base text-slate-900 text-right tabular-nums">
                <span
                  data-cy="results-percentage"
                  className="inline-flex items-center justify-end min-w-[65px] font-semibold"
                >
                  {percent(result.value).toFixed(2)}%
                </span>
              </td>
            </tr>
          ))}
          {/* Total row */}
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td className="px-6 py-4 text-sm font-bold text-slate-800 uppercase tracking-wide">
              Total
            </td>
            <td className="px-6 py-4 text-base font-bold text-slate-800 text-right tabular-nums">
              {totalVotes.toLocaleString()}
            </td>
            <td className="px-6 py-4 text-base font-bold text-slate-800 text-right tabular-nums">
              <span
                data-cy="results-total-percentage"
                className="inline-flex items-center justify-end min-w-[65px]"
              >
                {(totalVotes > 0 ? 100 : 0).toFixed(2)}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
