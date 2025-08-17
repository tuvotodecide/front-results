import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingButton from '../../components/LoadingButton';
import Modal from '../../components/Modal';
import ModalImage from '../../components/ModalImage';
import BackButton from '../../components/BackButton';
import {
  useCreatePoliticalPartyMutation,
  useGetPoliticalPartyQuery,
  useUpdatePoliticalPartyMutation,
} from '../../store/politicalParties/politicalPartiesEndpoints';
import {
  CreatePoliticalPartyType,
  UpdatePoliticalPartyType,
} from '../../types';

const PartidoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { data: currentItem, isLoading: isLoadingItem } =
    useGetPoliticalPartyQuery(id!, { skip: !id });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (currentItem?.logoUrl) {
      setPreviewUrl(currentItem.logoUrl);
    }
  }, [currentItem]);

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreatePoliticalPartyMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdatePoliticalPartyMutation();

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingItem;

  const validationSchema = Yup.object({
    partyId: Yup.string().required('Este campo es obligatorio'),
    fullName: Yup.string().required('Este campo es obligatorio'),
    shortName: Yup.string().required('Este campo es obligatorio'),
    logoUrl: Yup.string().url('Debe ser una URL válida'),
    color: Yup.string().required('Este campo es obligatorio'),
    active: Yup.boolean().required('Este campo es obligatorio'),
  });

  const initialValues = {
    partyId: currentItem?.partyId || '',
    fullName: currentItem?.fullName || '',
    shortName: currentItem?.shortName || '',
    logoUrl: currentItem?.logoUrl || '',
    color: currentItem?.color || '#000000',
    active: currentItem?.active ?? true,
  };

  const handleSubmit = async (
    values: UpdatePoliticalPartyType | CreatePoliticalPartyType
  ) => {
    console.log('Form submitted:', values);
    try {
      if (isEditMode && id) {
        await updateItem({ id, item: values }).unwrap();
        setIsModalOpen(true);
      } else {
        await createItem(values as CreatePoliticalPartyType).unwrap();
        setIsModalOpen(true);
      }
      navigate('/partidos-politicos');
    } catch (err) {
      console.error('Failed to save partido:', err);
    }
  };

  // const handleImageChange = (
  //   event: React.ChangeEvent<HTMLInputElement>,
  //   setFieldValue: (field: string, value: any) => void
  // ) => {
  //   const file = event.currentTarget.files?.[0];
  //   if (file) {
  //     setFieldValue("file", file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setPreviewUrl(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  return (
    <>
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center mb-8 border-b pb-4 border-gray-300">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-700">
              {isEditMode ? 'Editar' : 'Registro de'} Partido Político
            </h1>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? 'actualizar' : 'crear'} el partido. Por
              favor intente nuevamente.
            </div>
          )}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="partyId"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Sigla del Partido
                        </label>
                        <Field
                          id="partyId"
                          name="partyId"
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage
                          name="partyId"
                          component="div"
                          className="text-orange-600 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="color"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Color del Partido
                        </label>
                        <Field
                          id="color"
                          name="color"
                          type="color"
                          className="mt-1 h-10 w-full px-1 py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <ErrorMessage
                          name="color"
                          component="div"
                          className="text-orange-600 text-sm mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nombre del Partido
                      </label>
                      <Field
                        id="fullName"
                        name="fullName"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <ErrorMessage
                        name="fullName"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="shortName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Sigla
                      </label>
                      <Field
                        id="shortName"
                        name="shortName"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                      />
                      <ErrorMessage
                        name="shortName"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="logoUrl"
                        className="block text-sm font-medium text-gray-700"
                      >
                        URL del Logo
                      </label>
                      <Field
                        id="logoUrl"
                        name="logoUrl"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue('logoUrl', e.target.value);
                          setPreviewUrl(e.target.value);
                        }}
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                      />
                      <ErrorMessage
                        name="logoUrl"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <Field
                          name="active"
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Partido Activo
                        </span>
                      </label>
                      <ErrorMessage
                        name="active"
                        component="div"
                        className="text-orange-600 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="">
                      {previewUrl && (
                        <div
                          className="mt-4 relative cursor-pointer group"
                          onClick={() => setIsPreviewModalOpen(true)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </div>
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full max-h-72 object-contain rounded-lg border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate('/partidos-politicos')}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <LoadingButton
                    type="submit"
                    isLoading={isLoading || isSubmitting}
                  >
                    Guardar
                  </LoadingButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Exito"
      />

      <ModalImage
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        imageUrl={previewUrl}
      />
    </>
  );
};

export default PartidoForm;
