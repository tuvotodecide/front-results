import { GlobeAmericasIcon } from '@heroicons/react/24/solid';
import {
  MapIcon,
  MapPinIcon,
  RectangleGroupIcon,
  Square2StackIcon,
  StopIcon,
} from '@heroicons/react/24/outline';

interface LocationSectionProps {
  department: string;
  province: string;
  municipality: string;
  electoralLocation: string;
  electoralSeat: string;
}

const LocationSection = ({
  department = '',
  province = '',
  municipality = '',
  electoralLocation = '',
  electoralSeat = '',
}: LocationSectionProps) => {
  const location = [
    {
      title: 'Pais',
      value: 'Bolivia',
      icon: GlobeAmericasIcon,
    },
    {
      title: 'Departamento',
      value: department,
      icon: MapIcon,
    },
    {
      title: 'Provincia',
      value: province,
      icon: RectangleGroupIcon,
    },
    {
      title: 'Municipio',
      value: municipality,
      icon: Square2StackIcon,
    },
    {
      title: 'Asiento Electoral',
      value: electoralSeat,
      icon: StopIcon,
    },
    {
      title: 'Recinto electoral',
      value: electoralLocation,
      icon: MapPinIcon,
    },
  ];
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
        {location.map(
          (item, index) =>
            item.value && (
              <div
                className="flex items-start gap-3 min-w-0 flex-shrink-0"
                key={index}
              >
                <div className="flex-shrink-0 mt-1">
                  <item.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                    {item.title}
                  </h3>
                  <p className="text-base font-normal text-gray-900 leading-relaxed break-words">
                    {item.value}
                  </p>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default LocationSection;
