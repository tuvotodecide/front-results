import { useEffect, useState } from 'react';
// import ModalImage from '../../components/ModalImage';
// import actaImage from '../../assets/acta.jpg';
import LocationSection from './LocationSection';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetBallotQuery } from '../../store/ballots/ballotsEndpoints';
import Graphs from './Graphs';
import StatisticsBars from './StatisticsBars';
import SimpleSearchBar from '../../components/SimpleSearchBar';

// const ballotData = {
//   tableNumber: '25548',
//   imageUrl: actaImage,
// };

const ResultadosImagen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: currentItem, isError: isBallotError } = useGetBallotQuery(id!, {
    skip: !id,
  });

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) return;
    navigate(`/resultados/imagen/${searchTerm}`);
  };

  const [presidentialData, setPresidentialData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [deputiesData, setDeputiesData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [participation, setParticipation] = useState<
    Array<{ name: string; value: any; color: string }>
  >([]);

  useEffect(() => {
    if (currentItem && currentItem.votes) {
      console.log('current item', currentItem);
      const formattedPresidentialData =
        currentItem.votes.parties.partyVotes.map((item: any) => {
          // Generate random hex color if color not provided
          const randomColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16);
          return {
            name: item.partyId,
            value: item.votes,
            color: item.color || randomColor, // Use random color as fallback
          };
        });
      const formattedDeputiesData = currentItem.votes.deputies.partyVotes.map(
        (item: any) => {
          // Generate random hex color if color not provided
          const randomColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16);
          return {
            name: item.partyId,
            value: item.votes,
            color: item.color || randomColor, // Use random color as fallback
          };
        }
      );
      setPresidentialData(formattedPresidentialData);
      setDeputiesData(formattedDeputiesData);
      const participationData = [
        {
          name: 'Válidos',
          value: currentItem.votes.parties.validVotes || 0,
          color: '#8cc689', // Green
        },
        {
          name: 'Nulos',
          value: currentItem.votes.parties.nullVotes || 0,
          color: '#81858e', // Red
        },
        {
          name: 'Blancos',
          value: currentItem.votes.parties.blankVotes || 0,
          color: '#f3f3ce', // Yellow
        },
      ];
      setParticipation(participationData);
    }
  }, [currentItem]);

  // const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Imagen
        </h1>

        {!id ? (
          <div className="bg-white rounded-xl shadow-lg py-12 px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-600 mb-8">
                Introduzca el ID de la imagen
              </h1>
              <SimpleSearchBar
                className="w-full max-w-md"
                onSearch={handleSearch}
              />
            </div>
          </div>
        ) : isBallotError ? (
          <div className="bg-white rounded-xl shadow-lg py-12 px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-600 mb-4">
                No se encontró la imagen "{id}"
              </h1>
              <p className="text-lg text-gray-500 mb-8">
                Por favor, verifique el ID e intente con una imagen diferente
              </p>
              <SimpleSearchBar
                className="w-full max-w-md"
                onSearch={handleSearch}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg py-6 px-6">
            <div className="flex items-center mb-4 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
                Mesa #25548 &gt; Imagen {id}
              </h1>
              {/* <SearchBar className="ml-auto w-full" /> */}
            </div>
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                  Ubicacion
                </h3>
                <LocationSection
                  department={currentItem?.location.department || ''}
                  province={currentItem?.location.province || ''}
                  municipality={currentItem?.location.municipality || ''}
                  electoralLocation={
                    currentItem?.location.electoralLocationName || ''
                  }
                  electoralSeat={currentItem?.location.electoralSeat || ''}
                />
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="basis-[250px] grow-1 shrink-0">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                    Datos Imagen
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        Numero de mesa
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">
                        {currentItem?.tableNumber}
                      </h3>
                    </div>
                    <div>
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        Codigo de mesa
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">
                        {currentItem?.tableCode}
                      </h3>
                    </div>
                    <div>
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        A. a favor
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">x</h3>
                    </div>
                    <div>
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        A. en contra
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">y</h3>
                    </div>
                  </div>
                </div>
                <div className="basis-[250px] grow-1 shrink-0">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                    Contratos Inteligentes
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        CID IPFS
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">
                        {currentItem?.ipfsCid}
                      </h3>
                      <span>
                        <a
                          href={currentItem?.ipfsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver en IPFS
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="relative bg-white rounded-xl overflow-hidden shadow-md transition-transform duration-300 border border-gray-100 mb-8">
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
            </div> */}
            <div className="w-full flex flex-wrap gap-4 bg-gray-50 rounded-lg">
              <div className="px-0 md:px-6 pt-4 w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                  Participacion
                </h3>
                <StatisticsBars
                  voteData={participation}
                  processedTables={{ current: 1556, total: 2678 }}
                  totalTables={456}
                  totalVoters={1547}
                  totalActs={596}
                  totalWitnesses={500}
                />
              </div>
              <div className="basis-[min(400px,100%)] grow-1 shrink-1">
                <div className=" px-0 md:px-6 py-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                    Resultados Presidenciales
                  </h3>
                  <Graphs data={presidentialData} />
                </div>
              </div>
              <div className="basis-[min(400px,100%)] grow-1 shrink-1">
                <div className=" px-0 md:px-6 py-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                    Resultados Diputados
                  </h3>
                  <Graphs data={deputiesData} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultadosImagen;
