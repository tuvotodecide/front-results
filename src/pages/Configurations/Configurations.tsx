import { useEffect, useState } from 'react';
import {
  useGetConfigurationsQuery,
  useDeleteConfigurationMutation,
} from '../../store/configurations/configurationsEndpoints';
import { ConfigurationType } from '../../types';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';

const Configurations = () => {
  const navigation = useNavigate();
  const { data, isLoading } = useGetConfigurationsQuery();
  const [deleteConfiguration] = useDeleteConfigurationMutation();
  const [activeConfig, setActiveConfig] = useState<ConfigurationType | null>(
    null
  );
  const [otherConfigs, setOtherConfigs] = useState<Array<ConfigurationType>>(
    []
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] =
    useState<ConfigurationType | null>(null);

  useEffect(() => {
    if (data) {
      const tempActiveConfig = data.find((config) => !!config.isActive);
      const tempOtherConfigs = data.filter((config) => !config.isActive);
      if (tempActiveConfig) {
        setActiveConfig(tempActiveConfig);
      }
      setOtherConfigs(tempOtherConfigs);
    }
  }, [data]);

  const handleDelete = (config: ConfigurationType) => {
    setConfigToDelete(config);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!configToDelete) return;

    deleteConfiguration(configToDelete.id)
      .unwrap()
      .then(() => {
        // Update local state immediately after successful deletion
        if (configToDelete.isActive) {
          setActiveConfig(null);
        } else {
          setOtherConfigs((prev) =>
            prev.filter((config) => config.id !== configToDelete.id)
          );
        }
        setIsDeleteModalOpen(false);
        setConfigToDelete(null);
      })
      .catch((error) => {
        console.error('Failed to delete configuration:', error);
      });
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return { date: 'No definido', time: '' };
    const dateObj = new Date(dateTime);
    const date = dateObj.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = dateObj.toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date, time };
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3" />
        </svg>
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3" />
        </svg>
        Inactivo
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <svg
                  className="w-8 h-8 mr-3 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configuraciones del Sistema
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona las configuraciones de las elecciones y horarios del
                sistema
              </p>
            </div>
            <button
              onClick={() => navigation('/configuraciones/nueva')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Nueva Configuración
            </button>
          </div>
        </div>

        {/* Active Configuration */}
        {activeConfig && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
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
                    Configuración Activa
                  </h2>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(true)}
                    <button
                      onClick={() =>
                        navigation(`/configuraciones/editar/${activeConfig.id}`)
                      }
                      className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
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
                    </button>
                    <button
                      onClick={() => handleDelete(activeConfig)}
                      className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-white bg-red-500/20 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <div className="inner-container">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {activeConfig.name}
                  </h3>
                  <p className="text-gray-600">
                    Zona horaria: {activeConfig.timezone}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Voting Start */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="ml-3 text-lg font-semibold text-gray-800">
                        Apertura del Sistema
                      </h4>
                    </div>
                    <div className="text-gray-700 font-medium">
                      <div className="text-sm">
                        {
                          formatDateTime(activeConfig.votingStartDateBolivia)
                            .date
                        }
                      </div>
                      <div className="text-lg font-bold text-gray-700">
                        {
                          formatDateTime(activeConfig.votingStartDateBolivia)
                            .time
                        }
                      </div>
                    </div>
                  </div>

                  {/* Voting End */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="ml-3 text-lg font-semibold text-gray-800">
                        Cierre del Sistema
                      </h4>
                    </div>
                    <div className="text-gray-700 font-medium">
                      <div className="text-sm">
                        {formatDateTime(activeConfig.votingEndDateBolivia).date}
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {formatDateTime(activeConfig.votingEndDateBolivia).time}
                      </div>
                    </div>
                  </div>

                  {/* Results Start */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <h4 className="ml-3 text-lg font-semibold text-gray-800">
                        Publicación de Resultados
                      </h4>
                    </div>
                    <div className="text-gray-700 font-medium">
                      <div className="text-sm">
                        {
                          formatDateTime(activeConfig.resultsStartDateBolivia)
                            .date
                        }
                      </div>
                      <div className="text-lg font-bold text-gray-600">
                        {
                          formatDateTime(activeConfig.resultsStartDateBolivia)
                            .time
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-end">
                    <div className="text-sm text-gray-500">
                      <div>Actualizado:</div>
                      <div>{formatDateTime(activeConfig.updatedAt).date}</div>
                      <div className="font-semibold">
                        {formatDateTime(activeConfig.updatedAt).time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historical Configurations */}
        {otherConfigs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Historial de Configuraciones
            </h2>

            <div className="space-y-4">
              {otherConfigs.map((config) => (
                <div
                  key={config.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {config.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Zona horaria: {config.timezone}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(config.isActive)}
                      <button
                        onClick={() => handleDelete(config)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Inicio
                      </p>
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          {formatDateTime(config.votingStartDateBolivia).date}
                        </div>
                        <div className="font-bold text-gray-700">
                          {formatDateTime(config.votingStartDateBolivia).time}
                        </div>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Cierre
                      </p>
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          {formatDateTime(config.votingEndDateBolivia).date}
                        </div>
                        <div className="font-bold text-gray-800">
                          {formatDateTime(config.votingEndDateBolivia).time}
                        </div>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Resultados
                      </p>
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          {formatDateTime(config.resultsStartDateBolivia).date}
                        </div>
                        <div className="font-bold text-gray-600">
                          {formatDateTime(config.resultsStartDateBolivia).time}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!activeConfig && otherConfigs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay configuraciones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva configuración del sistema.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigation('/configuraciones/nueva')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Nueva Configuración
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setConfigToDelete(null);
        }}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro que deseas eliminar la configuración{' '}
            {configToDelete?.name}?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setConfigToDelete(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
