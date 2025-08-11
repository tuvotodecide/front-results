import { Link } from 'react-router-dom';
import actaImage from '../../assets/acta.jpg';
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

const ImagesSection = ({ images }: ImagesSectionProps) => {
  // Sample data - you can replace this with your actual data source
  // const images: Image[] = [
  //   {
  //     id: 1,
  //     number: 1,
  //     code: 'M001',
  //     status: 'processed',
  //     person: 'Juan Pérez',
  //     date: '2025-01-15',
  //     imageCode: 'IM778855',
  //     votesInFavor: 12,
  //     votesAgainst: 55,
  //   },
  //   {
  //     id: 2,
  //     number: 2,
  //     code: 'M002',
  //     status: 'unprocessed',
  //     person: 'María García',
  //     date: '2025-01-15',
  //     imageCode: 'IM778856',
  //     votesInFavor: 8,
  //     votesAgainst: 42,
  //   },
  //   {
  //     id: 3,
  //     number: 3,
  //     code: 'M003',
  //     status: 'dispute',
  //     person: 'Carlos López',
  //     date: '2025-01-15',
  //     imageCode: 'IM778857',
  //     votesInFavor: 25,
  //     votesAgainst: 30,
  //   },
  //   {
  //     id: 4,
  //     number: 4,
  //     code: 'M004',
  //     status: 'unprocessed',
  //     person: 'Ana Martínez',
  //     date: '2025-01-15',
  //     imageCode: 'IM778858',
  //     votesInFavor: 15,
  //     votesAgainst: 38,
  //   },
  // ];

  const handleCardClick = (item: BallotType) => {
    if (item.status === 'unprocessed') {
      return; // Do nothing for unprocessed mesas
    }
    // click handler
  };

  return (
    <div className="p-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 max-w-full">
        {images.map((image) => (
          <Link to={`/resultados/imagen/${image._id}`} key={image._id}>
            <div className="relative">
              <div
                className="rounded-lg overflow-hidden shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md"
                onClick={() => handleCardClick(image)}
              >
                {/* Background area with acta image */}
                <div className="h-32 relative">
                  <img
                    src={actaImage}
                    alt="Acta Electoral"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300/30 to-gray-400/30"></div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    Código imagen
                  </h3>
                  <p className="text-gray-700 text-base mb-3 font-medium">
                    {image.ipfsCid}
                  </p>

                  {/* Vote counts */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">A favor:</span>
                      <span className="font-semibold text-gray-800">X</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">En contra:</span>
                      <span className="font-semibold text-gray-800">Y</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        <Link to={`/resultados/imagen/example`} key={`example`}>
          <div className="relative">
            <div
              className="rounded-lg overflow-hidden shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={() => () => {}}
            >
              {/* Background area with acta image */}
              <div className="h-32 relative">
                <img
                  src={actaImage}
                  alt="Acta Electoral"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300/30 to-gray-400/30"></div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">
                  Código imagen
                </h3>
                <p className="text-gray-700 text-base mb-3 font-medium">
                  IM123456 ejemplo
                </p>

                {/* Vote counts */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">A favor:</span>
                    <span className="font-semibold text-gray-800">X</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">En contra:</span>
                    <span className="font-semibold text-gray-800">Y</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ImagesSection;
