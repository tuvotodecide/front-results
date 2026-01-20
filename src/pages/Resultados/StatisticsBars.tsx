//import { useEffect, useState } from 'react';

interface VoteData {
  name: string;
  value: number;
  color: string;
}

interface ProcessedTables {
  current: number;
  total: number;
}

interface StatisticsBarsProps {
  title: string;
  voteData: VoteData[];
  processedTables: ProcessedTables;
  totalTables?: number; // Optional prop for total tables
  totalVoters?: number; // Optional prop for total voters
  totalActs?: number; // Optional prop for total acts
  totalWitnesses?: number; // Optional prop for total witnesses
}

const StatisticsBars = ({
  title,
  voteData = [],
}: // processedTables = { current: 0, total: 0 },
// totalTables = 0,
// totalVoters = 0,
// totalActs = 0,
// totalWitnesses = 0,
StatisticsBarsProps) => {
  // const [animationComplete, setAnimationComplete] = useState(false);

  // Data from the image
  // const progressPercentage = processedTables.total
  //   ? ((processedTables.current / processedTables.total) * 100).toFixed(1)
  //   : 0;

  const totalVotes = voteData.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  // Compute percentage for each vote type

  const voteDataWithPercentage = voteData.map((item) => {
    const v = Number(item.value) || 0;
    const pct = totalVotes > 0 ? (v / totalVotes) * 100 : 0;
    return {
      ...item,
      value: v,
      percentage: pct.toFixed(2), // <-- 2 decimales
    };
  });

  // Cards data
  // const cardsData = [
  //   { title: 'Número de mesas', value: totalTables },
  //   { title: 'Votantes habilitados', value: totalVoters },
  //   { title: 'Actas subidas', value: totalActs },
  //   { title: 'Número de atestiguamientos', value: totalWitnesses },
  // ];

  // useEffect(() => {
  //   const timer = setTimeout(() => setAnimationComplete(true), 100);
  //   return () => clearTimeout(timer);
  // }, []);

  const formatNumber = (num: number) => {
    return num?.toLocaleString("es-ES");
  };
  return (
    <div data-cy="statsbars">
      {/* cards section */}
      {/* <div className="flex flex-wrap gap-4 pb-4 overflow-hidden">
        {cardsData.map(
          (card) =>
            !!card.value && (
              <div
                key={card.title}
                className="min-w-0 flex-shrink bg-white rounded-lg p-4 border border-gray-200"
              >
                <h3
                  className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate"
                  title={card.title}
                >
                  {card.title}
                </h3>
                <p
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate"
                  title={formatNumber(card.value)}
                >
                  {formatNumber(card.value)}
                </p>
              </div>
            )
        )}
      </div> */}
      {/* Processing Progress */}
      <div className="mb-3">
        {/* <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
          <h2 className="text-md  text-slate-600">
            Mesas Procesadas
            <span className="text-md font-medium text-gray-600 ml-2">
              ({progressPercentage}%)
            </span>
          </h2>
          <span className="text-md  text-slate-600">
            {formatNumber(processedTables.current)} /{' '}
            {formatNumber(processedTables.total)} mesas
          </span>
        </div> */}

        {/* Main Progress Bar */}
        {/* <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-2000 ease-out rounded-full shadow-sm"
            style={{
              width: animationComplete ? `${progressPercentage}%` : '0%',
            }}
          ></div>
        </div> */}
      </div>

      {/* Vote Distribution Progress */}
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
          <h2 className="text-md text-slate-600">{title}</h2>
          <span data-cy="total-votes" className="text-md text-slate-600">
            Total: {formatNumber(totalVotes)}
          </span>
        </div>

        {totalVotes === 0 || voteData.length === 0 ? (
          /* No Data Message */
          <div className="flex items-center justify-center h-16 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
            <span className="text-slate-500 text-sm font-medium">
              Sin datos
            </span>
          </div>
        ) : (
          <>
            {/* Vote Distribution Bar - Full Width */}
            <div className="relative">
              {/* Background showing full width */}
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                {/* Container that shows full width */}
                <div
                  className="h-full flex transition-all duration-500 ease-out"
                  style={{
                    // width: animationComplete ? '100%' : '0%',
                    width: "100%",
                  }}
                >
                  {/* Vote type sections within the full area */}
                  {voteDataWithPercentage.map((item, index) => (
                    <div
                      key={item.name}
                      className="h-full transition-all duration-1500 ease-out first:rounded-l-full last:rounded-r-full"
                      style={{
                        backgroundColor: item.color,
                        border: "1px solid rgba(0, 0, 0, 0.4)",
                        width: `${item.percentage}%`,
                        transitionDelay: `${index * 200 + 400}ms`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vote Type Legend - Below Bar Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3">
              {voteDataWithPercentage.map((item) => (
                <div key={item.name} className="flex items-center text-sm">
                  <div
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{
                      border: "1px solid rgba(0, 0, 0, 0.4)",
                      backgroundColor: item.color,
                    }}
                  ></div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-700">
                      {item.name}
                    </span>
                    <span className="text-slate-600 ml-1 whitespace-nowrap">
                      <span data-cy="vote-percentage">{item.percentage}%</span>{" "}
                      ({formatNumber(item.value)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsBars;
