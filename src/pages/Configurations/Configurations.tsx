import { useState } from 'react';
import Modal from '../../components/Modal';

const Configurations = () => {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');
  const [isEditingTests, setIsEditingTests] = useState(false);
  const [isEditingResults, setIsEditingResults] = useState(false);
  const [showResultsDateTime, setShowResultsDateTime] = useState('');
  const [tempShowResultsDateTime, setTempShowResultsDateTime] = useState('');

  const handleEdit = () => {
    setTempStartTime(startTime);
    setTempEndTime(endTime);
    setIsEditingTests(true);
  };

  const handleSave = () => {
    if (isEditingTests) {
      setStartTime(tempStartTime);
      setEndTime(tempEndTime);
      setIsEditingTests(false);
    } else if (isEditingResults) {
      setShowResultsDateTime(tempShowResultsDateTime);
      setIsEditingResults(false);
    }
    setIsConfirmationModalOpen(false);
  };

  const handleCancel = () => {
    setTempStartTime('');
    setTempEndTime('');
    setIsEditingTests(false);
  };

  const handleEditResults = () => {
    setIsEditingResults(true);
  };

  const handleCancelResults = () => {
    setTempStartTime('');
    setIsEditingResults(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Configuraciones
        </h1>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
            Horarios de pruebas
          </h3>
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 w-48">
                Horario de inicio
              </label>
              {isEditingTests ? (
                <input
                  className="flex-1 max-w-xs border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm transition-colors"
                  type="datetime-local"
                  value={tempStartTime}
                  onChange={(e) => setTempStartTime(e.target.value)}
                />
              ) : (
                <div className="flex-1 max-w-xs border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                  {startTime || 'No definido'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 w-48">
                Horario de fin
              </label>
              {isEditingTests ? (
                <input
                  className="flex-1 max-w-xs border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm transition-colors"
                  type="datetime-local"
                  value={tempEndTime}
                  onChange={(e) => setTempEndTime(e.target.value)}
                />
              ) : (
                <div className="flex-1 max-w-xs border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                  {endTime || 'No definido'}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            {!isEditingTests && (
              <button
                className="px-6 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 hover:border-amber-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                onClick={handleEdit}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar
                </span>
              </button>
            )}
            {isEditingTests && (
              <>
                <button
                  className="px-6 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => {
                    setIsConfirmationModalOpen(true);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Guardar
                  </span>
                </button>
                <button
                  className="px-6 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={handleCancel}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancelar
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
            Habilitación de resultados
          </h3>
          <div className="mt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 w-48">
                Fecha Hora de habilitación
              </label>
              {isEditingResults ? (
                <input
                  className="flex-1 max-w-xs border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm transition-colors"
                  type="datetime-local"
                  value={tempShowResultsDateTime}
                  onChange={(e) => setTempShowResultsDateTime(e.target.value)}
                />
              ) : (
                <div className="flex-1 max-w-xs border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                  {showResultsDateTime || 'No definido'}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            {!isEditingResults && (
              <button
                className="px-6 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 hover:border-amber-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                onClick={handleEditResults}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar
                </span>
              </button>
            )}
            {isEditingResults && (
              <>
                <button
                  className="px-6 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => {
                    setIsConfirmationModalOpen(true);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Guardar
                  </span>
                </button>
                <button
                  className="px-6 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={handleCancelResults}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancelar
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isConfirmationModalOpen}
        onClose={() => {
          setIsConfirmationModalOpen(false);
        }}
        title="Confirmar cambios"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 text-sm">
              ¿Estás seguro que deseas guardar los cambios realizados?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsConfirmationModalOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Configurations;
