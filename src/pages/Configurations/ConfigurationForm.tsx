import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import Modal from '../../components/Modal';
import BackButton from '../../components/BackButton';
import {
  useCreateConfigurationMutation,
  useUpdateConfigurationMutation,
  useGetConfigurationQuery,
} from '../../store/configurations/configurationsEndpoints';
import { CreateConfigurationType, UpdateConfigurationType } from '../../types';

const ConfigurationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateMode = location.pathname === '/configuraciones/nueva';

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<CreateConfigurationType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // API hooks
  const [createConfiguration] = useCreateConfigurationMutation();
  const [updateConfiguration] = useUpdateConfigurationMutation();
  const { data: existingConfig, isLoading: isLoadingConfig } =
    useGetConfigurationQuery(id!, { skip: isCreateMode || !id });

  const validationSchema = Yup.object({
    name: Yup.string().required('El nombre de la configuración es requerido'),
    votingStartDate: Yup.string().required('La fecha de inicio es requerida'),
    votingEndDate: Yup.string().required('La fecha de fin es requerida'),
    resultsStartDate: Yup.string().required(
      'La fecha de habilitación es requerida'
    ),
  });

  const initialValues: CreateConfigurationType = {
    name: existingConfig?.name || '',
    votingStartDate: existingConfig?.votingStartDateBolivia || '',
    votingEndDate: existingConfig?.votingEndDateBolivia || '',
    resultsStartDate: existingConfig?.resultsStartDateBolivia || '',
    allowDataModification: true,
  };

  const handleSubmit = (values: CreateConfigurationType) => {
    // Clear any previous error message
    setErrorMessage('');
    // Always set allowDataModification to true
    const submissionValues = {
      ...values,
      allowDataModification: true,
    };
    console.log('Form values sent to backend:', submissionValues);
    setPendingValues(submissionValues);
    setIsConfirmationModalOpen(true);
  };

  const handleSave = async () => {
    if (!pendingValues) return;

    try {
      if (isCreateMode) {
        await createConfiguration(pendingValues).unwrap();
      } else if (id) {
        await updateConfiguration({
          id,
          item: pendingValues as UpdateConfigurationType,
        }).unwrap();
      }
      navigate('/configuraciones');
    } catch (error: any) {
      console.error('Error saving configuration:', error);

      // Extract error message from the API response
      if (error?.data?.message) {
        setErrorMessage(error.data.message);
      } else if (error?.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          'Ocurrió un error inesperado al guardar la configuración'
        );
      }
    } finally {
      setIsConfirmationModalOpen(false);
      setPendingValues(null);
    }
  };

  if (!isCreateMode && isLoadingConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <BackButton className="mr-4" />
          <h1 className="text-3xl font-bold text-gray-800">
            {isCreateMode ? 'Nueva Configuración' : 'Editar Configuración'}
          </h1>
        </div>
        <div className="bg-white rounded-[8px] border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
            {isCreateMode
              ? 'Crear nueva configuración'
              : 'Editar configuración'}
          </h3>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">Error</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={() => setErrorMessage('')}
                      className="inline-flex rounded-md p-1.5 text-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                    >
                      <span className="sr-only">Cerrar</span>
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
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched }) => (
              <Form className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 w-48">
                    Nombre de la configuración *
                  </label>
                  <div className="flex-1 max-w-xs">
                    <Field
                      name="name"
                      type="text"
                      className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm transition-colors"
                    />
                    {errors.name && touched.name && (
                      <div className="text-red-500 text-xs mt-1">
                        {errors.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 w-48">
                    Apertura del sistema *
                  </label>
                  <div className="flex-1 max-w-xs">
                    <Field
                      name="votingStartDate"
                      type="datetime-local"
                      className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm transition-colors"
                    />
                    {errors.votingStartDate && touched.votingStartDate && (
                      <div className="text-red-500 text-xs mt-1">
                        {errors.votingStartDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 w-48">
                    Cierre del sistema *
                  </label>
                  <div className="flex-1 max-w-xs">
                    <Field
                      name="votingEndDate"
                      type="datetime-local"
                      className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm transition-colors"
                    />
                    {errors.votingEndDate && touched.votingEndDate && (
                      <div className="text-red-500 text-xs mt-1">
                        {errors.votingEndDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 w-48">
                    Habilitación de Resultados *
                  </label>
                  <div className="flex-1 max-w-xs">
                    <Field
                      name="resultsStartDate"
                      type="datetime-local"
                      className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm transition-colors"
                    />
                    {errors.resultsStartDate && touched.resultsStartDate && (
                      <div className="text-red-500 text-xs mt-1">
                        {errors.resultsStartDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    onClick={() => navigate('/configuraciones')}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-slate-600 rounded hover:bg-gray-300 transition-colors"
                  >
                    Guardar
                  </button>
                </div>

                <Modal
                  isOpen={isConfirmationModalOpen}
                  onClose={() => {
                    setIsConfirmationModalOpen(false);
                    setPendingValues(null);
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
                        {isCreateMode
                          ? '¿Estás seguro que deseas crear esta configuración?'
                          : '¿Estás seguro que deseas guardar los cambios realizados?'}
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmationModalOpen(false);
                          setPendingValues(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-slate-600 rounded hover:bg-gray-300 transition-colors"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </Modal>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationForm;
