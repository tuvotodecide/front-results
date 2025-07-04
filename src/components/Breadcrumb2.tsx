import React, { useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = () => {
  const [selectedPath, setSelectedPath] = useState([]);

  const levels = [
    {
      id: 'departamento',
      title: 'Departamento',
      options: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Potosí'],
    },
    {
      id: 'circunscripcion',
      title: 'Circunscripción',
      options: ['Circunscripción 1', 'Circunscripción 2', 'Circunscripción 3'],
    },
    {
      id: 'provincia',
      title: 'Provincia',
      options: ['Murillo', 'Omasuyos', 'Pacajes', 'Los Andes'],
    },
    {
      id: 'municipio',
      title: 'Municipio',
      options: ['La Paz', 'El Alto', 'Achocalla', 'Palca'],
    },
    {
      id: 'asiento',
      title: 'Asiento Electoral',
      options: ['Asiento 001', 'Asiento 002', 'Asiento 003'],
    },
    {
      id: 'recinto',
      title: 'Recinto Electoral',
      options: ['Recinto A', 'Recinto B', 'Recinto C'],
    },
  ];

  const handleLevelClick = (levelIndex, option) => {
    const newPath = selectedPath.slice(0, levelIndex);
    newPath.push({
      level: levels[levelIndex],
      value: option,
      index: levelIndex,
    });
    setSelectedPath(newPath);
  };

  const handleBreadcrumbClick = (index) => {
    setSelectedPath(selectedPath.slice(0, index + 1));
  };

  const resetPath = () => {
    setSelectedPath([]);
  };

  const currentLevel =
    selectedPath.length < levels.length ? levels[selectedPath.length] : null;

  return (
    <div className="mx-auto p-6 bg-white">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <nav className="flex items-center space-x-2 text-sm">
          <button
            onClick={resetPath}
            className="flex flex-col items-center text-blue-600 hover:text-blue-800 group"
          >
            <div className="text-xs text-gray-500 font-medium mb-1">País</div>
            <div className="flex items-center">
              <span className="font-medium">Bolivia</span>
            </div>
          </button>

          {selectedPath.map((pathItem, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="flex flex-col items-center text-blue-600 hover:text-blue-800 hover:underline group"
              >
                <div className="text-xs text-gray-500 font-medium mb-1">
                  {pathItem.level.title}
                </div>
                <div className="font-medium">{pathItem.value}</div>
              </button>
            </React.Fragment>
          ))}

          {currentLevel && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex flex-col items-center text-gray-500">
                <div className="text-xs font-medium">{currentLevel.title}</div>
                {/* <div className="font-medium">.</div> */}
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Current Level Selection */}
      {currentLevel ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Seleccione {currentLevel.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentLevel.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleLevelClick(selectedPath.length, option)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="font-medium text-gray-800">{option}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {currentLevel.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-800 font-semibold text-lg mb-2">
            ¡Navegación Completa!
          </div>
          <p className="text-green-700 mb-4">
            Ha completado la selección de todos los niveles administrativos.
          </p>
          <button
            onClick={resetPath}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Comenzar de Nuevo
          </button>
        </div>
      )}

      {/* Selected Path Summary */}
      {selectedPath.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            Ruta Seleccionada:
          </h3>
          <div className="space-y-1">
            {selectedPath.map((pathItem, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-blue-700 font-medium">
                  {pathItem.level.title}:
                </span>
                <span className="text-blue-600">{pathItem.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Breadcrumb;
