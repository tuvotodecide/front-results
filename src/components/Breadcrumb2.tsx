import React, { useState, useEffect, use } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import { useLazyGetDepartmentsQuery } from '../store/departments/departmentsEndpoints';

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

const Breadcrumb = () => {
  const [getDepartments] = useLazyGetDepartmentsQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPath, setSelectedPath] = useState<PathItem[]>([]);
  const [levels, setLevels] = useState(levels2);

  // Helper: Build query params from selectedPath
  const buildQueryParams = (pathArr: PathItem[]) => {
    // const params: Record<string, string> = {};
    // pathArr.forEach((item) => {
    //   params[item.level.id] = item.value;
    // });
    // return params;
  };

  // When a level is clicked, update state and URL
  const handleLevelClick = (levelIndex: number, option: LevelOption) => {
    console.log(
      '%cLevel selectedPath:',
      'color: green; font-size: 16px; font-weight: bold;',
      selectedPath
    );
    const newPath: PathItem[] = selectedPath.slice(0, levelIndex);
    newPath.push({
      level: levels[levelIndex],
      value: option,
      index: levelIndex,
    });
    console.log(
      '%cOption:',
      'color: blue; font-size: 16px; font-weight: bold;',
      levels[levelIndex]
    );
    const idLevel = levels[levelIndex].id;
    if (idLevel === 'departamento') {
    }

    setSelectedPath(newPath);
    // setSearchParams(buildQueryParams(newPath));
  };

  const handleBreadcrumbClick = (index: number) => {
    setShowCurrentLevel(!showCurrentLevel);
    const newPath = selectedPath.slice(0, index + 1);
    setSelectedPath(newPath);
    // setSearchParams(buildQueryParams(newPath));
  };

  const resetPath = () => {
    setSelectedPath([]);
    // setSearchParams({});
  };

  const currentLevel =
    selectedPath.length < levels.length ? levels[selectedPath.length] : null;

  // State to control visibility of the current level selection section
  const [showCurrentLevel, setShowCurrentLevel] = useState(false);

  // Show the next breadcrumb level form when "ver más" is clicked
  const handleShowNextLevel = () => {
    setShowCurrentLevel(true);
  };

  // // On mount and when searchParams change, sync selectedPath with URL
  // useEffect(() => {
  //   // Build selectedPath from searchParams
  //   const newPath = [];
  //   for (let i = 0; i < levels.length; i++) {
  //     const paramValue = searchParams.get(levels[i].id);
  //     if (paramValue) {
  //       newPath.push({
  //         level: levels[i],
  //         value: paramValue,
  //         index: i,
  //       });
  //     } else {
  //       break;
  //     }
  //   }
  //   setSelectedPath(newPath);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchParams]);

  useEffect(() => {
    getDepartments({})
      .unwrap()
      .then((resp) => {
        const departmentOptions = resp.data.map((dept) => {
          return { _id: dept._id, name: dept.name };
        });
        setLevels((prevLevels) => {
          const updatedLevels = prevLevels.map((level) => {
            if (level.id === 'departamento') {
              return {
                ...level,
                options: departmentOptions,
              };
            }
            return level;
          });
          return updatedLevels;
        });
        console.log('Fetched departments:', departmentOptions);
      });
  }, [getDepartments]);

  return (
    <div className="mx-auto py-6 bg-white">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
        <nav className="flex items-center gap-x-1.5 gap-y-3 text-sm flex-wrap w-full">
          <button
            onClick={resetPath}
            className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100"
          >
            <div className="text-xs text-gray-500 font-medium mb-1">País</div>
            <div className="flex items-center">
              <span className="font-medium">Bolivia</span>
            </div>
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />

          {selectedPath.map((pathItem, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="flex flex-col items-start text-black group min-w-[120px] border border-gray-300 p-2 rounded hover:bg-blue-100 "
              >
                <div className="text-xs text-gray-500 font-medium mb-1">
                  {pathItem.level.title}
                </div>
                <div className="font-medium">{pathItem.value.name}</div>
              </button>
              {index < selectedPath.length - 1 && (
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
      {currentLevel && showCurrentLevel && (
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
              Seleccione {currentLevel.title}
            </h2>
            <SearchBar className="shrink mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentLevel.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleLevelClick(selectedPath.length, option)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="font-medium text-gray-800">{option.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {currentLevel.title}
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
