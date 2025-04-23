import React, { useState } from "react";
import Modal from "react-modal";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RecintoElectoral } from "../../types/recintos";
import {
  useCreatePartidoMutation,
  useUpdatePartidoMutation,
  useGetPartidoQuery,
} from "../../store/partidos/partidosEndpoints";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

Modal.setAppElement("#root");

const PartidoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreatePartidoMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdatePartidoMutation();
  const { data: currentItem, isLoading: isLoadingItem } = useGetPartidoQuery(
    id!,
    { skip: !id }
  );

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingItem;

  const validationSchema = Yup.object({
    partyId: Yup.string().required("Este campo es obligatorio"),
    fullName: Yup.string().required("Este campo es obligatorio"),
    logoUrl: Yup.string().required("Este campo es obligatorio"),
    color: Yup.string().required("Este campo es obligatorio"),
    legalRepresentative: Yup.string().required("Este campo es obligatorio"),
  });

  const initialValues = {
    partyId: currentItem?.partyId || "",
    fullName: currentItem?.fullName || "",
    logoUrl: currentItem?.logoUrl || "",
    color: currentItem?.color || "",
    legalRepresentative: currentItem?.legalRepresentative || "",
    active: currentItem?.active || "",
    electionParticipation: [],
  };

  const handleSubmit = async (
    values: Omit<RecintoElectoral, "_id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (isEditMode && id) {
        await updateItem({ id, recinto: values }).unwrap();
      } else {
        await createItem(values).unwrap();
      }
      navigate("/recintos");
    } catch (err) {
      console.error("Failed to save recinto:", err);
    }
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      setFieldValue("file", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="w-full max-w-4xl p-8 bg-white rounded shadow-md">
          <h1 className="text-2xl font-bold text-left mb-6 text-red-600">
            {isEditMode ? "Editar" : "Registro de"} Partido Politico
          </h1>
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error al {isEditMode ? "actualizar" : "crear"} el recinto. Por
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
              <Form>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Sigla del Partido
                    </label>
                    <Field
                      id="department"
                      name="department"
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="department"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      htmlFor="province"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nombre del Partido
                    </label>
                    <Field
                      id="province"
                      name="province"
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="province"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="legalRepresentative"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Representante Legal
                    </label>
                    <Field
                      id="legalRepresentative"
                      name="legalRepresentative"
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="legalRepresentative"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cargar Imagen
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, setFieldValue)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {previewUrl && (
                      <div
                        className="mt-2 relative cursor-pointer"
                        onClick={() => setIsPreviewModalOpen(true)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center hover:bg-black/30 transition-colors duration-200 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                          className="w-full h-auto rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/recintos")}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-gray-600 mr-2"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-700"
                    disabled={isLoading || isSubmitting}
                  >
                    {isLoading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={true}
      >
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-auto">
          <div className="flex flex-col items-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-4 text-green-600">
              ¡Éxito!
            </h2>
            <p className="text-center mb-6">
              El acta se ha subido correctamente.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/resultados")}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPreviewModalOpen}
        onRequestClose={() => {
          setIsPreviewModalOpen(false);
        }}
        className="modal-content"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={true}
        style={{
          overlay: {
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          },
        }}
      >
        <div className="bg-white p-4 rounded-lg shadow-xl max-w-4xl w-full mx-auto relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => {
              setIsPreviewModalOpen(false);
            }}
            className="absolute top-2 right-2 z-50 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {previewUrl && (
            <div className="mt-8">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto object-contain"
                draggable={false}
              />
            </div>
          )}
        </div>
      </Modal>
      <style>
        {`
          .modal-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .modal-content {
            position: relative;
            outline: none;
            width: 100%;
          }
        `}
      </style>
    </>
  );
};

export default PartidoForm;
