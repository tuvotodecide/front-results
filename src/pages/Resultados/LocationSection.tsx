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
    <div className="w-full flex flex-col gap-2 justify-center items-start sm:flex-row sm:flex-wrap sm:justify-start sm:gap-x-6 ">
      {location.map(
        (item) =>
          item.value && (
            <div className="flex flex-col gap-2 px-3 py-2">
              <div className="text-md font-bold text-slate-900 flex items-center gap-2 lg:text-lg">
                <item.icon className="w-5 h-5" />
                <h3 className="text-md font-bold lg:text-lg text-gray-600">
                  {item.title}
                </h3>
              </div>
              <h3 className="text-md font-bold lg:text-lg">{item.value}</h3>
            </div>
          )
      )}
    </div>
  );
};

export default LocationSection;
