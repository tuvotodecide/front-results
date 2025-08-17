import {
  AttestationsBallotType,
  BallotType,
  MostSupportedBallotType,
} from '../../types';
import { useMemo } from 'react';

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
  mostSupportedBallot?: MostSupportedBallotType | null | undefined;
  attestationCases?: AttestationsBallotType[];
}

const nftBaseUrl = import.meta.env.VITE_BASE_NFT_URL;

const ImagesSection = ({
  images,
  mostSupportedBallot,
  attestationCases,
}: ImagesSectionProps) => {
  // Combine images with attestation cases data
  const combinedImagesData = useMemo(() => {
    return images.map((image) => {
      const matchingAttestation = attestationCases?.find(
        (attestation) => attestation.ballotId === image._id
      );

      return {
        ...image,
        supports: matchingAttestation?.supports || null,
      };
    });
  }, [images, attestationCases]);

  const getImageUrl = (image: BallotType) => {
    const baseUrl = 'https://ipfs.io/ipfs/';
    const ipfsHash = image.image.replace('ipfs://', '');
    return `${baseUrl}${ipfsHash}`;
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 w-full">
        {combinedImagesData.map((image) => (
          <div key={image._id} className="w-full sm:max-w-sm">
            <div
              className={`bg-white rounded-lg shadow-md border transition-all duration-300 hover:shadow-lg w-full border-gray-200 hover:border-gray-300`}
            >
              {/* Header Section */}
              <div className="border-b border-gray-100 p-5 pb-4">
                <div className="flex items-center justify-between mb-3 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 flex-shrink-0">
                    Acta Electoral
                  </h3>
                  {mostSupportedBallot &&
                    image._id === mostSupportedBallot.ballotId && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 flex-shrink min-w-0 overflow-hidden">
                        <svg
                          className="w-3 h-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate whitespace-nowrap">
                          Mas apoyada
                        </span>
                      </span>
                    )}
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

                  <div className="flex flex-col pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600 font-medium mb-3">
                      Atestiguamientos
                    </span>
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between items-center py-1.5 px-2 border border-gray-200 rounded bg-gray-50 min-w-0">
                        <span className="text-xs text-gray-700 font-medium truncate">
                          Usuarios
                        </span>
                        <span className="text-sm font-semibold text-gray-800 flex-shrink-0 ml-2">
                          {image.supports?.users || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 px-2 border border-gray-200 rounded bg-gray-50 min-w-0">
                        <span className="text-xs text-gray-700 font-medium truncate">
                          Jurados
                        </span>
                        <span className="text-sm font-semibold text-gray-800 flex-shrink-0 ml-2">
                          {image.supports?.juries || 0}
                        </span>
                      </div>
                    </div>
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
                  <a
                    href={`/resultados/imagen/${image._id}`}
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 text-center no-underline inline-block"
                  >
                    Detalles
                  </a>
                  <a
                    href={getImageUrl(image)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 text-center no-underline inline-block"
                  >
                    Imagen
                  </a>
                  <a
                    href={nftBaseUrl + image.recordId}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 text-center no-underline inline-block"
                  >
                    NFT
                  </a>
                  <a
                    href={image.ipfsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 text-center no-underline inline-block"
                  >
                    Metadata
                  </a>
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
