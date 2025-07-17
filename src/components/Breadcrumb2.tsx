import React, { useState, useEffect, use } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import {
  useGetDepartmentQuery,
  useGetDepartmentsQuery,
  useLazyGetDepartmentsQuery,
} from '../store/departments/departmentsEndpoints';
import { useSelector } from 'react-redux';
import { selectDepartments } from '../store/departments/departmentsSlice';
import { index } from 'd3';
import { useLazyGetProvincesByDepartmentIdQuery } from '../store/provinces/provincesEndpoints';
import { useLazyGetMunicipalitiesByProvinceIdQuery } from '../store/municipalities/municipalitiesEndpoints';
import { useLazyGetElectoralSeatsByMunicipalityIdQuery } from '../store/electoralSeats/electoralSeatsEndpoints';
import { useLazyGetElectoralLocationsByElectoralSeatIdQuery } from '../store/electoralLocations/electoralLocationsEndpoints';

interface LevelOption {
  _id: string;
  name: string;
}

interface Level {
  id: string;
  title: string;
  options: LevelOption[];
}

interface PathItem {
  level: Level;
  value: LevelOption;
  index: number;
}

const levels2: Level[] = [
  {
    id: 'departamento',
    title: 'Departamento',
    options: [],
  },
  {
    id: 'provincia',
    title: 'Provincia',
    options: [
      { _id: 'murillo', name: 'Murillo' },
      { _id: 'omasuyos', name: 'Omasuyos' },
      { _id: 'pacajes', name: 'Pacajes' },
      { _id: 'los-andes', name: 'Los Andes' },
    ],
  },
  {
    id: 'municipio',
    title: 'Municipio',
    options: [
      { _id: 'la-paz', name: 'La Paz' },
      { _id: 'el-alto', name: 'El Alto' },
      { _id: 'achocalla', name: 'Achocalla' },
      { _id: 'palca', name: 'Palca' },
    ],
  },
  {
    id: 'asiento',
    title: 'Asiento Electoral',
    options: [
      { _id: 'asiento-001', name: 'Asiento 001' },
      { _id: 'asiento-002', name: 'Asiento 002' },
      { _id: 'asiento-003', name: 'Asiento 003' },
    ],
  },
  {
    id: 'recinto',
    title: 'Recinto Electoral',
    options: [
      { _id: 'recinto-a', name: 'Recinto A' },
      { _id: 'recinto-b', name: 'Recinto B' },
      { _id: 'recinto-c', name: 'Recinto C' },
    ],
  },
];

interface breadcrumbOptions {
  departments: LevelOption[];
  provinces: LevelOption[];
  municipalities: LevelOption[];
  electoralSeats: LevelOption[];
  electoralLocations: LevelOption[];
}

interface PathItem2 {
  id: string;
  title: string;
  selectedOption?: LevelOption | null;
}

interface SelectedLevel extends PathItem2 {
  options: LevelOption[];
  index: number;
}

const breadcrumbLevels = [
  {
    id: 'departments',
    title: 'Departamento',
  },
  {
    id: 'provinces',
    title: 'Provincia',
  },
  {
    id: 'municipalities',
    title: 'Municipio',
  },
  {
    id: 'electoralSeats',
    title: 'Asiento Electoral',
  },
  {
    id: 'electoralLocations',
    title: 'Recinto Electoral',
  },
];
const Breadcrumb = () => {
  const [getDepartments] = useLazyGetDepartmentsQuery();
  const [getProvincesByDepartmentId] = useLazyGetProvincesByDepartmentIdQuery();
  const [getMunicipalitiesByProvinceId] =
    useLazyGetMunicipalitiesByProvinceIdQuery();
  const [getElectoralSeatsByMunicipalityId] =
    useLazyGetElectoralSeatsByMunicipalityIdQuery();
  const [getElectoralLocationsByElectoralSeatId] =
    useLazyGetElectoralLocationsByElectoralSeatIdQuery();

  const departments = useSelector(selectDepartments);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPath, setSelectedPath] = useState<PathItem[]>([]);
  const [levels, setLevels] = useState(levels2);
  const [options, setOptions] = useState<breadcrumbOptions>({
    departments: [],
    provinces: [],
    municipalities: [],
    electoralSeats: [],
    electoralLocations: [],
  });
  const [selectedPath2, setSelectedPath2] = useState<PathItem2[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<SelectedLevel | null>(
    null
  );
  // State to control visibility of the current level selection section
  const [showCurrentLevel, setShowCurrentLevel] = useState(false);

  // Helper: Build query params from selectedPath
  const buildQueryParams = (pathArr: PathItem[]) => {
    // const params: Record<string, string> = {};
    // pathArr.forEach((item) => {
    //   params[item.level.id] = item.value;
    // });
    // return params;
  };

  useEffect(() => {
    if (departments && departments.length > 0) {
      console.log(
        '%cDepartments fetched:',
        'color: green; font-size: 16px; font-weight: bold;',
        departments
      );
      setOptions((prev) => ({
        ...prev,
        departments: departments.map((dept) => ({
          _id: dept._id,
          name: dept.name,
        })),
      }));
    }
  }, [departments]);

  const handleOptionClick = (
    optionIndex: number,
    optionClicked: LevelOption
  ) => {
    // Then update any item that matches the optionId with the clicked option
    const newPath: PathItem2[] = selectedPath2.slice(0, optionIndex);
    const baseNewItem = breadcrumbLevels[optionIndex];
    console.log(
      '%cBase new item:',
      'color: orange; font-size: 16px; font-weight: bold;',
      baseNewItem
    );

    const newItem = {
      ...baseNewItem,
      selectedOption: optionClicked,
    };
    newPath.push(newItem);

    setSelectedPath2(newPath);

    const reachedEnd = optionIndex >= breadcrumbLevels.length - 1;
    if (!reachedEnd) {
      selectLevel(optionIndex + 1, newPath);
    } else {
      setShowCurrentLevel(false);
    }

    // setSearchParams(buildQueryParams(newPath));
  };

  const selectLevel = async (
    levelIndex: number,
    pathOverride?: PathItem2[]
  ) => {
    const item = breadcrumbLevels[levelIndex];

    const levelOptions = await getOptionsForLevel(levelIndex, pathOverride);
    const newSelectedLevel: SelectedLevel = {
      ...item,
      selectedOption: null, // Reset selected option for the new level
      options: levelOptions,
      index: levelIndex,
    };
    console.log(
      '%cNew selected level:',
      'color: orange; font-size: 16px; font-weight: bold;',
      newSelectedLevel
    );
    setSelectedLevel(newSelectedLevel);
    //setShowCurrentLevel(true);
  };

  const getOptionsForLevel = async (
    levelIndex: number,
    pathOverride?: PathItem2[]
  ): Promise<LevelOption[]> => {
    console.log(
      '%cGetting options for level:',
      'color: blue; font-size: 16px; font-weight: bold;',
      levelIndex
    );
    if (levelIndex === 0) {
      return options.departments;
    }
    const currentPath = pathOverride || selectedPath2;
    console.log(
      '%ccurrentPath:',
      'color: blue; font-size: 16px; font-weight: bold;',
      currentPath
    );
    const idParentOption = currentPath[levelIndex - 1]?.selectedOption?._id;
    console.log(
      '%cParent option ID:',
      'color: purple; font-size: 16px; font-weight: bold;',
      idParentOption
    );
    if (!idParentOption) {
      return [];
    }
    switch (levelIndex) {
      case 0:
        // GET departments
        console.log(
          '%cDepartments fetched:',
          'color: green; font-size: 16px; font-weight: bold;',
          options.departments
        );
        return options.departments;
      case 1:
        const resp = await getProvincesByDepartmentId(idParentOption).unwrap();
        console.log(
          '%cProvinces fetched for department222222:',
          'color: green; font-size: 16px; font-weight: bold;',
          resp
        );
        // GET provinces based on selected department
        return resp;
      case 2:
        const municipalitiesResp = await getMunicipalitiesByProvinceId(
          idParentOption
        ).unwrap();
        console.log(
          '%cMunicipalities fetched for province:',
          'color: green; font-size: 16px; font-weight: bold;',
          municipalitiesResp
        );
        return municipalitiesResp;
        return options.municipalities;
      case 3:
        const electoralSeatsResp = await getElectoralSeatsByMunicipalityId(
          idParentOption
        ).unwrap();
        console.log(
          '%cElectoral seats fetched for municipality:',
          'color: green; font-size: 16px; font-weight: bold;',
          electoralSeatsResp
        );
        return electoralSeatsResp;
        return options.electoralSeats;
      case 4:
        const electoralLocationsResp =
          await getElectoralLocationsByElectoralSeatId(idParentOption).unwrap();
        console.log(
          '%cElectoral locations fetched for electoral seat:',
          'color: green; font-size: 16px; font-weight: bold;',
          electoralLocationsResp
        );
        return electoralLocationsResp;
      default:
        return [];
    }
  };

  const handleBreadcrumbClick = async (pathItem: PathItem2, index: number) => {
    if (selectedLevel?.id !== pathItem.id && !showCurrentLevel) {
      setShowCurrentLevel(true);
    } else if (selectedLevel?.id === pathItem.id) {
      setShowCurrentLevel(!showCurrentLevel);
    }
    console.log(
      '%cBreadcrumb clicked:',
      'color: purple; font-size: 16px; font-weight: bold;',
      pathItem
    );

    //select level function
    const levelOptions = await getOptionsForLevel(index);
    setSelectedLevel({
      ...pathItem,
      options: levelOptions,
      index: index,
    });
  };

  const resetPath = () => {
    setSelectedPath2([]);
    selectLevel(0);
    setShowCurrentLevel((prev) => !prev);
    // setSearchParams({});
  };
  // Show the next breadcrumb level form when "ver más" is clicked
  const handleShowNextLevel = () => {
    setShowCurrentLevel(true);
  };

  return (
    <div className="mx-auto py-6 bg-white">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
        <nav className="flex items-center gap-x-1.5 gap-y-3 text-sm flex-wrap w-full">
          <button
            onClick={() => resetPath()}
            className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100"
          >
            <div className="text-xs text-gray-500 font-medium mb-1">País</div>
            <div className="flex items-center">
              <span className="font-medium">Bolivia</span>
            </div>
          </button>
          {selectedPath2.length > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
          )}

          {selectedPath2.map((pathItem, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => handleBreadcrumbClick(pathItem, index)}
                className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100 "
              >
                <div className="text-xs text-gray-500 font-medium mb-1">
                  {pathItem.title}
                </div>
                <div className="font-medium">
                  {pathItem?.selectedOption?.name}
                </div>
              </button>
              {index < selectedPath2.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              )}
            </React.Fragment>
          ))}

          <button
            className="ml-auto px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors duration-200 shrink-0"
            onClick={handleShowNextLevel}
            disabled={selectedPath.length >= levels.length}
          >
            Ver más
          </button>
        </nav>
        {/* Ver más button */}
      </div>

      {/* Current Level Selection (Closable) */}
      {selectedLevel && showCurrentLevel && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 relative mt-6">
          {/* Close button, floating on top right */}
          <button
            className="absolute -top-3 -right-3 p-2 rounded-full bg-gray-50 hover:bg-gray-200 text-gray-400 hover:text-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-gray-300"
            style={{ zIndex: 20 }}
            aria-label="Cerrar"
            onClick={() => setShowCurrentLevel(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M4 20L20 4M4 4L20 20"
              />
            </svg>
          </button>
          <div className="flex items-center mb-4 justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Seleccione {selectedLevel?.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedLevel?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(selectedLevel.index, option)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="font-medium text-gray-800">{option.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedLevel.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Breadcrumb;
