import { useNavigate } from 'react-router-dom';
import { BallotType } from '../../types';

// interface Image {
//   id: number;
//   number: number;
//   code: string;
//   status: 'unprocessed' | 'processed' | 'dispute';
//   person: string;
//   date: string;
//   imageCode: string;
//   votesInFavor: number;
//   votesAgainst: number;
// }

interface ImagesSectionProps {
  images: BallotType[];
}

const nftBaseUrl =
  'https://testnet.routescan.io/nft/0xdCa6d6E8f4E69C3Cf86B656f0bBf9b460727Bed9/';

const ImagesSection = ({ images }: ImagesSectionProps) => {
  const navigate = useNavigate();

  const getImageUrl = (image: BallotType) => {
    const baseUrl = 'https://ipfs.io/ipfs/';
    const ipfsHash = image.image.replace('ipfs://', '');
    return `${baseUrl}${ipfsHash}`;
  };

  const handleButtonClick = (
    e: React.MouseEvent,
    action: string,
    image: BallotType
  ) => {
    e.preventDefault();
    e.stopPropagation();

    switch (action) {
      case 'details':
        navigate(`/resultados/imagen/${image._id}`);
        break;
      case 'metadata':
        window.open(image.ipfsUri, '_blank');

        break;
      case 'image':
        window.open(getImageUrl(image), '_blank');
        break;
      case 'nft':
        window.open(nftBaseUrl + image.recordId, '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 w-full">
        {images.map((image) => (
          <div key={image._id} className="w-full sm:max-w-sm">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-gray-300 w-full">
              {/* Header Section */}
              <div className="border-b border-gray-100 p-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Acta Electoral
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      image.valuable
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {image.valuable ? 'Principal' : 'Respaldo'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">
                      Versión
                    </span>
                    <span className="text-lg text-gray-900 break-words mt-1 font-bold">
                      {image.version}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Preview Section */}
              <div className="px-5 pb-4">
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={getImageUrl(image)}
                    alt="Acta Electoral Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/src/assets/acta.jpg'; // Fallback image
                    }}
                  />
                </div>
              </div>

              {/* Actions Section */}
              <div className="p-5 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Acciones disponibles
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => handleButtonClick(e, 'details', image)}
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                  >
                    Detalles
                  </button>
                  <button
                    onClick={(e) => handleButtonClick(e, 'image', image)}
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                  >
                    Imagen
                  </button>
                  <button
                    onClick={(e) => handleButtonClick(e, 'nft', image)}
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                  >
                    NFT
                  </button>
                  <button
                    onClick={(e) => handleButtonClick(e, 'metadata', image)}
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                  >
                    Metadata
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagesSection;
