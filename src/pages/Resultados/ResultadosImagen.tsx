import { useState } from 'react';
import BarChart from '../../components/BarChart';
import D3PieChart from '../../components/D3PieChart';
import ResultsTable from '../../components/ResultsTable';
import {
  Check,
  X,
  Trophy,
  BarChart3,
  Vote,
  PieChart,
  Table,
} from 'lucide-react';
import ModalImage from '../../components/ModalImage';
import actaImage from '../../assets/acta.jpg';
import LocationSection from './LocationSection';
import { useParams } from 'react-router-dom';

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

const ballotData = {
  tableNumber: '25548',
  imageUrl: actaImage,
};

const ResultadosImagen = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('bars');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Imagen
        </h1>
        <div className="bg-white rounded-xl shadow-lg py-6 px-6">
          <div className="flex items-center mb-4 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
              Mesa #25548 &gt; Imagen {id}
            </h1>
            {/* <SearchBar className="ml-auto w-full" /> */}
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
              Ubicacion
            </h3>
            <LocationSection
              department="Cochabamba"
              province="Esteban Arze"
              municipality="Anzaldo"
              electoralLocation="U.E. Arturo Sarmiento de Quiriria"
              electoralSeat="Quiriria"
            />
          </div>
          <div className="relative bg-white rounded-xl overflow-hidden shadow-md transition-transform duration-300 border border-gray-100 mb-8">
            {ballotData.imageUrl ? (
              <>
                <img
                  src={ballotData.imageUrl}
                  alt={`Acta de la mesa ${ballotData.tableNumber}`}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setIsImageModalOpen(true)}
                />
                <ModalImage
                  isOpen={isImageModalOpen}
                  onClose={() => setIsImageModalOpen(false)}
                  imageUrl={ballotData.imageUrl}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-[400px] bg-gray-50">
                <p className="text-gray-400 text-lg">
                  No hay imagen disponible
                </p>
              </div>
            )}
          </div>
          <div className="w-full flex flex-wrap gap-4">
            <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden basis-[min(400px,100%)] grow-3 shrink-0">
              <div className="border-b border-gray-300 px-1 md:px-6 py-4">
                <div className="mb-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('table')}
                      className={`pb-2 px-4 font-medium flex items-center gap-2 ${
                        activeTab === 'table'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Table className="w-5 h-5 flex-shrink-0" />
                      <span className="max-md:hidden">Tabla</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bars')}
                      className={`pb-2 px-4 font-medium flex items-center gap-2 ${
                        activeTab === 'bars'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5 flex-shrink-0" />
                      <span className="max-md:hidden">Gráfico de Barras</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pie')}
                      className={`pb-2 px-4 font-medium flex items-center gap-2 ${
                        activeTab === 'pie'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <PieChart className="w-5 h-5 flex-shrink-0" />
                      <span className="max-md:hidden">Gráfico Circular</span>
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
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 basis-[250px] grow-1 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                Atestiguamientos
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">A favor</p>
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
                      <p className="text-sm text-gray-600 mb-1">En contra</p>
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
        </div>
      </div>
    </div>
  );
};

export default ResultadosImagen;
