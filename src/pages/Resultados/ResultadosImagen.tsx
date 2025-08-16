import { useEffect, useState } from 'react';
// import ModalImage from '../../components/ModalImage';
// import actaImage from '../../assets/acta.jpg';
import LocationSection from './LocationSection';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetBallotQuery } from '../../store/ballots/ballotsEndpoints';
import Graphs from './Graphs';
import StatisticsBars from './StatisticsBars';
import SimpleSearchBar from '../../components/SimpleSearchBar';
import BackButton from '../../components/BackButton';
import { useDispatch } from 'react-redux';
import { setCurrentBallot } from '../../store/resultados/resultadosSlice';
import { useGetAttestationsByBallotIdQuery } from '../../store/attestations/attestationsEndpoints';

// const ballotData = {
//   tableNumber: '25548',
//   imageUrl: actaImage,
// };

const ResultadosImagen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: currentItem, isError: isBallotError } = useGetBallotQuery(id!, {
    skip: !id,
  });
  const { data: attestationsData } = useGetAttestationsByBallotIdQuery(id!, {
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

  useEffect(() => {
    if (id) {
      dispatch(setCurrentBallot(id));
    }
  }, [id]);

  useEffect(() => {
    if (attestationsData) {
      console.log('Attestations Data:', attestationsData);
    }
  }, [attestationsData]);

  // const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <div className="outer-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Imagen
        </h1>

        {!id ? (
          <div className="bg-white rounded-lg shadow-md py-16 px-8 border border-gray-200">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <svg
                  className="w-12 h-12 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
                Introduzca el ID de la imagen
              </h1>
              <p className="text-gray-500 mb-8">
                Busque los resultados por ID de imagen específico
              </p>
              <SimpleSearchBar
                className="w-full max-w-md"
                onSearch={handleSearch}
              />
            </div>
          </div>
        ) : isBallotError ? (
          <div className="bg-white rounded-lg shadow-md py-16 px-8 border border-red-200">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-red-50 rounded-full p-4 mb-4">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
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
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header Section */}
            <div className="bg-gray-800 text-white p-6 rounded-t-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <BackButton className="text-white hover:text-gray-300 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl md:text-3xl font-semibold break-words">
                      Imagen {id}
                    </h1>
                    <p className="text-gray-300 mt-1 break-words">
                      Codigo mesa: {currentItem?.tableCode || ''}
                    </p>
                  </div>
                </div>
                <SimpleSearchBar
                  className="w-full lg:w-auto lg:shrink-1 lg:ml-auto"
                  onSearch={handleSearch}
                />
                {/* <div className="bg-gray-700 rounded px-4 py-2">
                  <span className="text-sm font-medium">ID: {id}</span>
                </div> */}
              </div>
            </div>

            {/* Content */}
            <div className="inner-container">
              {/* Location Section */}
              <div className="flex flex-row flex-wrap gap-4">
                <div className="rounded-lg p-6 mb-4 border border-gray-200 basis-[450px] grow-2 shrink-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    Ubicación
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
                <div className="border border-gray-200 rounded-lg p-6 mb-4 basis-[300px] grow-1 shrink-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    Datos Mesa
                  </h3>
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    <div className="flex items-start gap-3 min-w-0 flex-shrink-0">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Numero de mesa
                        </h3>
                        <p className="text-base font-normal text-gray-900 leading-relaxed break-words">
                          {currentItem?.tableNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 min-w-0 flex-shrink-0">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Codigo de mesa
                        </h3>
                        <p className="text-base font-normal text-gray-900 leading-relaxed break-words">
                          {currentItem?.tableCode || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attestation Information and Smart Contracts Section */}
              <div className="flex flex-row flex-wrap gap-4 mb-4">
                {/* Attestation Information - Highlighted and Formal */}
                <div className="border border-gray-200 rounded-lg p-6 basis-[450px] grow-2 shrink-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Atestiguamientos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* A. a favor */}
                    <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-green-800 mb-1">
                            Atestiguamientos a favor
                          </h4>
                          <p className="text-3xl font-bold text-green-900">x</p>
                        </div>
                        <div className="text-green-600">
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* A. en contra */}
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-red-800 mb-1">
                            Atestiguamientos en contra
                          </h4>
                          <p className="text-3xl font-bold text-red-900">y</p>
                        </div>
                        <div className="text-red-600">
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Contracts Section - Minimalist */}
                <div className="border border-gray-200 rounded-lg p-6 basis-[300px] grow-1 shrink-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Contratos Inteligentes
                  </h3>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Acciones disponibles
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          if (currentItem?.image) {
                            const baseUrl = 'https://ipfs.io/ipfs/';
                            const ipfsHash = currentItem.image.replace(
                              'ipfs://',
                              ''
                            );
                            window.open(`${baseUrl}${ipfsHash}`, '_blank');
                          }
                        }}
                        className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                      >
                        Imagen
                      </button>
                      <button
                        onClick={() => {
                          if (currentItem?.ipfsUri) {
                            window.open(currentItem.ipfsUri, '_blank');
                          }
                        }}
                        className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                      >
                        Metadata
                      </button>
                      <button
                        onClick={() => {
                          if (currentItem?.recordId) {
                            const nftBaseUrl =
                              'https://testnet.routescan.io/nft/0xdCa6d6E8f4E69C3Cf86B656f0bBf9b460727Bed9/';
                            window.open(
                              nftBaseUrl + currentItem.recordId,
                              '_blank'
                            );
                          }
                        }}
                        className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                      >
                        NFT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Image section */}
              {/* <div className="relative bg-white rounded-xl overflow-hidden shadow-md transition-transform duration-300 border border-gray-100 mb-8 max-w-[400px]">
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
              {/* Results Section */}
              <div className="border border-gray-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  Participación
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    Resultados Presidenciales
                  </h3>
                  <Graphs data={presidentialData} />
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
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
