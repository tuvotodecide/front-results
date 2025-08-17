import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  MapIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

interface StatisticCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
  bgColorClass: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatisticCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  bgColorClass,
  trend,
}: StatisticCardProps) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center">
      <div className={`flex-shrink-0 ${bgColorClass} p-2 rounded-md`}>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colorClass}`} />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            {title}
          </p>
          {trend && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                trend.isPositive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value.toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
          {typeof value === 'string' ? value : value.toLocaleString()}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

const Statistics = () => {
  // Mock data for the electoral dashboard
  const mockStats = {
    totalMesas: 45678,
    votantesHabilitados: 8234567,
    mesasProcesadas: 42156,
    actasProcesadas: 41892,
    recintos: 3456,
    recintosActivos: 3401,
    participacion: 67.8,
    votosValidos: 5587234,
    votosNulos: 234567,
    votosBlancos: 156789,
    totalVotos: 5978590,
  };

  const progressPercentage =
    (mockStats.mesasProcesadas / mockStats.totalMesas) * 100;
  const actasProgressPercentage =
    (mockStats.actasProcesadas / mockStats.totalMesas) * 100;

  return (
    <div className="w-full bg-gray-50 p-2 sm:p-4">
      <div className="max-w-full mx-auto">
        {/* Main Statistics Grid - More compact on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-4">
          <StatisticCard
            title="Total de Mesas"
            value={mockStats.totalMesas}
            subtitle="Mesas habilitadas"
            icon={ChartBarIcon}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-100"
          />

          <StatisticCard
            title="Votantes Habilitados"
            value={mockStats.votantesHabilitados}
            subtitle="Ciudadanos con derecho a voto"
            icon={UserGroupIcon}
            colorClass="text-green-600"
            bgColorClass="bg-green-100"
          />

          <StatisticCard
            title="Mesas Procesadas"
            value={mockStats.mesasProcesadas}
            subtitle={`${progressPercentage.toFixed(1)}% del total`}
            icon={CheckCircleIcon}
            colorClass="text-purple-600"
            bgColorClass="bg-purple-100"
            trend={{ value: progressPercentage, isPositive: true }}
          />

          <StatisticCard
            title="Actas Procesadas"
            value={mockStats.actasProcesadas}
            subtitle={`${actasProgressPercentage.toFixed(1)}% del total`}
            icon={DocumentTextIcon}
            colorClass="text-orange-600"
            bgColorClass="bg-orange-100"
            trend={{ value: actasProgressPercentage, isPositive: true }}
          />
        </div>

        {/* Secondary Statistics - Stacked on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-4">
          <StatisticCard
            title="Recintos Electorales"
            value={mockStats.recintos}
            subtitle={`${mockStats.recintosActivos} activos`}
            icon={MapIcon}
            colorClass="text-indigo-600"
            bgColorClass="bg-indigo-100"
          />

          <StatisticCard
            title="Participación"
            value={`${mockStats.participacion}%`}
            subtitle="Porcentaje de participación"
            icon={CalculatorIcon}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-100"
          />

          <StatisticCard
            title="Votos Válidos"
            value={mockStats.votosValidos}
            subtitle="Votos contabilizados"
            icon={CheckCircleIcon}
            colorClass="text-green-600"
            bgColorClass="bg-green-100"
          />

          <StatisticCard
            title="Total de Votos"
            value={mockStats.totalVotos}
            subtitle="Incluyendo nulos y blancos"
            icon={ChartBarIcon}
            colorClass="text-gray-600"
            bgColorClass="bg-gray-100"
          />
        </div>

        {/* Progress and Vote Distribution - Stack on mobile and small tablets */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Progreso de Procesamiento
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Mesas Procesadas
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {mockStats.mesasProcesadas.toLocaleString()} /{' '}
                    {mockStats.totalMesas.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Actas Procesadas
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {mockStats.actasProcesadas.toLocaleString()} /{' '}
                    {mockStats.totalMesas.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${actasProgressPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {actasProgressPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Distribución de Votos
            </h3>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Votos Válidos
                </span>
                <span className="text-xs sm:text-sm text-green-600 font-semibold">
                  {mockStats.votosValidos.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Votos Nulos
                </span>
                <span className="text-xs sm:text-sm text-red-600 font-semibold">
                  {mockStats.votosNulos.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Votos en Blanco
                </span>
                <span className="text-xs sm:text-sm text-yellow-600 font-semibold">
                  {mockStats.votosBlancos.toLocaleString()}
                </span>
              </div>

              <hr className="border-gray-200" />

              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  Total
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {mockStats.totalVotos.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Progress Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Progreso Electoral y Distribución de Votos
          </h3>

          <div className="space-y-2">
            {/* Main Progress Bar - Mesas Procesadas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Mesas Procesadas
                </span>
                <span className="text-sm text-gray-500 font-semibold">
                  {mockStats.mesasProcesadas.toLocaleString()} /{' '}
                  {mockStats.totalMesas.toLocaleString()} (
                  {progressPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Vote Distribution Bar - Based on processed tables percentage */}
            <div>
              {/* Segmented Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="flex h-full rounded-full overflow-hidden"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div
                    className="bg-green-500 transition-all duration-300 first:rounded-l-full"
                    style={{
                      width: `${
                        (mockStats.votosValidos / mockStats.totalVotos) * 100
                      }%`,
                    }}
                    title={`Votos Válidos: ${mockStats.votosValidos.toLocaleString()}`}
                  ></div>
                  <div
                    className="bg-red-500 transition-all duration-300"
                    style={{
                      width: `${
                        (mockStats.votosNulos / mockStats.totalVotos) * 100
                      }%`,
                    }}
                    title={`Votos Nulos: ${mockStats.votosNulos.toLocaleString()}`}
                  ></div>
                  <div
                    className="bg-yellow-500 transition-all duration-300 last:rounded-r-full"
                    style={{
                      width: `${
                        (mockStats.votosBlancos / mockStats.totalVotos) * 100
                      }%`,
                    }}
                    title={`Votos en Blanco: ${mockStats.votosBlancos.toLocaleString()}`}
                  ></div>
                </div>
              </div>

              {/* Title and data below the second bar */}
              <div className="flex items-center justify-between mt-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Distribución de Votos Procesados
                </span>
                <span className="text-sm text-gray-500">
                  {mockStats.totalVotos.toLocaleString()} votos totales
                </span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">
                    Válidos:{' '}
                    {(
                      (mockStats.votosValidos / mockStats.totalVotos) *
                      100
                    ).toFixed(1)}
                    % ({mockStats.votosValidos.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">
                    Nulos:{' '}
                    {(
                      (mockStats.votosNulos / mockStats.totalVotos) *
                      100
                    ).toFixed(1)}
                    % ({mockStats.votosNulos.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">
                    Blancos:{' '}
                    {(
                      (mockStats.votosBlancos / mockStats.totalVotos) *
                      100
                    ).toFixed(1)}
                    % ({mockStats.votosBlancos.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators - More compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            Estado del Sistema
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="flex items-center p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-green-900 truncate">
                  Sistema Operativo
                </p>
                <p className="text-xs text-green-700 truncate">
                  Funcionando correctamente
                </p>
              </div>
            </div>

            <div className="flex items-center p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
              <ClockIcon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-900 truncate">
                  Actualización Automática
                </p>
                <p className="text-xs text-blue-700 truncate">
                  Cada 30 segundos
                </p>
              </div>
            </div>

            <div className="flex items-center p-2 sm:p-3 bg-purple-50 rounded-lg border border-purple-200 sm:col-span-2 lg:col-span-1">
              <ChartBarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-purple-900 truncate">
                  Datos Sincronizados
                </p>
                <p className="text-xs text-purple-700 truncate">
                  Última sync: hace 2 min
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
