import { useState } from 'react';
import BarChart from '../../components/BarChart';
import D3PieChart from '../../components/D3PieChart';
import ResultsTable from '../../components/ResultsTable';
import SearchBar from '../../components/SearchBar';
import { Check, X, Trophy, BarChart3, Vote } from 'lucide-react';

const combinedData = [
  { name: 'Party A', value: 100, color: '#FF6384' },
  { name: 'Party B', value: 200, color: '#36A2EB' },
  { name: 'Party C', value: 150, color: '#FFCE56' },
  { name: 'Party D', value: 80, color: '#4BC0C0' },
  { name: 'Party E', value: 120, color: '#9966FF' },
  { name: 'Party F', value: 90, color: '#FF9F40' },
  { name: 'Party G', value: 60, color: '#FF6384' },
  { name: 'Party H', value: 110, color: '#36A2EB' },
];

const mesas: any[] = [
  { id: 123, person: 'JANE DRINKS', date: '13 June 2023' },
  { id: 24, person: 'TONY HUNGRY', date: '13 June 2023' },
  { id: 32, person: 'TONY HUNGRY', date: '13 June 2023' },
  { id: 15, person: 'JANE DRINKS', date: '13 June 2023' },
  { id: 44, person: 'JANE DRINKS', date: '13 June 2023' },
  { id: 23, person: 'TONY HUNGRY', date: '13 June 2023', hasNote: true },
  { id: 1255, person: 'JANE DRINKS', date: '13 June 2023' },
  { id: 78, person: 'MIKE SILVA', date: '13 June 2023' },
];

const ResultadosMesa2 = () => {
  const [activeTab, setActiveTab] = useState('bars');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Mesa
        </h1>
        <div className="bg-white rounded-xl shadow-lg py-6 px-6">
          <div className="flex items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
              Mesa #25548
            </h1>
            <SearchBar className="shrink ml-auto" />
          </div>
          <div className="w-full flex flex-wrap gap-4">
            <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden md:min-w-[400px] sm:min-w-[400px] flex-grow">
              <div className="border-b border-gray-300  px-6 py-4">
                <div className="mb-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('bars')}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === 'bars'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Gráfico de Barras
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pie')}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === 'pie'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Gráfico Circular
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('table')}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === 'table'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Tabla
                    </button>
                  </div>
                </div>
                {activeTab === 'bars' && <BarChart data={combinedData} />}
                {activeTab === 'pie' && <D3PieChart data={combinedData} />}
                {activeTab === 'table' && (
                  <ResultsTable resultsData={combinedData} />
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 min-w-3xs flex-grow">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                Atestiguamientos
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        como correctos
                      </p>
                      <p className="text-2xl font-bold text-gray-800">360</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        como incorrectos
                      </p>
                      <p className="text-2xl font-bold text-gray-800">120</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full">
                      <X className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 my-6 pb-3 border-b border-gray-200">
                Contratos inteligentes
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors duration-200 flex items-center justify-between group">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-gray-800 font-medium">NFT</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>

                <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors duration-200 flex items-center justify-between group">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-gray-800 font-medium">
                      Resultados totales
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>

                <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors duration-200 flex items-center justify-between group">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Vote className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-gray-800 font-medium">
                      Votos específicos
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden mt-6">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-800">
                Imagenes mas apoyadas
              </h2>
            </div>

            {/* Grid Content */}
            <div className="p-6">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                }}
              >
                {mesas.map((mesa) => (
                  <div key={mesa.id} className="relative min-w-[200px]">
                    {/* Card */}
                    <div className="bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                      {/* Background area instead of image */}
                      <div className="h-32 bg-gradient-to-br from-gray-300 to-gray-400"></div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-lg mb-3">
                          Imagen {mesa.id}
                        </h3>

                        {/* Footer Info */}
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="truncate mr-2">{mesa.person}</span>
                          <span className="whitespace-nowrap">{mesa.date}</span>
                        </div>
                      </div>

                      {/* Load Notes Overlay */}
                      {mesa.hasNote && (
                        <div className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 rounded text-xs">
                          Load Notes
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosMesa2;
