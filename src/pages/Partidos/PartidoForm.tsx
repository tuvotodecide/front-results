import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import {
  useCreatePartidoMutation,
  useUpdatePartidoMutation,
  useGetPartidoQuery,
} from "../../store/partidos/partidosEndpoints";
import { useNavigate, useParams } from "react-router-dom";
import { Partido } from "../../types/partidos";
import LoadingButton from "../../components/LoadingButton";
import Modal from "../../components/Modal";
import ModalImage from "../../components/ModalImage";
import BackButton from "../../components/BackButton";

const PartidoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { data: currentItem, isLoading: isLoadingItem } = useGetPartidoQuery(
    id!,
    { skip: !id }
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (currentItem?.logoUrl) {
      setPreviewUrl(currentItem.logoUrl);
    }
  }, [currentItem]);

  const [createItem, { isLoading: isCreating, error: createError }] =
    useCreatePartidoMutation();
  const [updateItem, { isLoading: isUpdating, error: updateError }] =
    useUpdatePartidoMutation();

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating || isLoadingItem;

  const validationSchema = Yup.object({
    partyId: Yup.string().required("Este campo es obligatorio"),
    fullName: Yup.string().required("Este campo es obligatorio"),
    // logoUrl: Yup.string().required("Este campo es obligatorio"),
    // color: Yup.string().required("Este campo es obligatorio"),
    legalRepresentative: Yup.string().required("Este campo es obligatorio"),
    electionParticipation: Yup.array().of(
      Yup.object().shape({
        electionYear: Yup.number().required("El año es obligatorio"),
        candidateName: Yup.string().required(
          "El nombre del candidato es obligatorio"
        ),
        position: Yup.string().required("El cargo es obligatorio"),
        enabled: Yup.boolean(),
      })
    ),
  });

  const initialValues = {
    partyId: currentItem?.partyId || "",
    fullName: currentItem?.fullName || "",
    logoUrl: currentItem?.logoUrl || "",
    color: currentItem?.color || "#000000",
    legalRepresentative: currentItem?.legalRepresentative || "",
    active: currentItem?.active ?? true,
    electionParticipation: currentItem?.electionParticipation || [],
  };

  const handleSubmit = async (values: Omit<Partido, "_id">) => {
    console.log("Form submitted:", values);
    try {
      if (isEditMode && id) {
        await updateItem({ id, partido: values }).unwrap();
        setIsModalOpen(true);
      } else {
        await createItem(values).unwrap();
        setIsModalOpen(true);
      }
      navigate("/partidos");
    } catch (err) {
      console.error("Failed to save partido:", err);
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
              {isEditMode ? "Editar" : "Registro de"} Partido Político
            </h1>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg">
              Error al {isEditMode ? "actualizar" : "crear"} el partido. Por
              favor intente nuevamente.
            </div>
          )}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, setFieldValue, values }) => (
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
                        htmlFor="legalRepresentative"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Representante Legal
                      </label>
                      <Field
                        id="legalRepresentative"
                        name="legalRepresentative"
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                      />
                      <ErrorMessage
                        name="legalRepresentative"
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
                          setFieldValue("logoUrl", e.target.value);
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

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-md font-semibold text-gray-800"
                      onClick={() => {
                        setIsModalOpen(true);
                      }}
                    >
                      Participantes
                    </h3>
                    <FieldArray name="electionParticipation">
                      {({ push }) => (
                        <button
                          type="button"
                          onClick={() =>
                            push({
                              electionYear: new Date().getFullYear(),
                              candidateName: "",
                              position: "",
                              enabled: true,
                            })
                          }
                          className="inline-flex items-center px-4 py-1 bg-transparent hover:bg-blue-100 text-blue-700 border border-blue-500 rounded transition-colors duration-150 ease-in-out"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="-ml-1 mr-2 h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Agregar Participante
                        </button>
                      )}
                    </FieldArray>
                  </div>

                  <FieldArray name="electionParticipation">
                    {({ remove }) => (
                      <div className="space-y-4">
                        {values.electionParticipation.map((_, index) => (
                          <div
                            key={index}
                            className="p-6 border rounded-lg bg-gray-50 border-gray-300 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                  Habilitado
                                </label>
                                <div className="flex items-center justify-center">
                                  <Field
                                    type="checkbox"
                                    name={`electionParticipation.${index}.enabled`}
                                    className="h-7 w-7 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Año Electoral
                                </label>
                                <Field
                                  name={`electionParticipation.${index}.electionYear`}
                                  type="number"
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <ErrorMessage
                                  name={`electionParticipation.${index}.electionYear`}
                                  component="div"
                                  className="text-orange-600 text-sm mt-1"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Nombre del Candidato
                                </label>
                                <Field
                                  name={`electionParticipation.${index}.candidateName`}
                                  type="text"
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <ErrorMessage
                                  name={`electionParticipation.${index}.candidateName`}
                                  component="div"
                                  className="text-orange-600 text-sm mt-1"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Cargo
                                </label>
                                <Field
                                  name={`electionParticipation.${index}.position`}
                                  type="text"
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                <ErrorMessage
                                  name={`electionParticipation.${index}.position`}
                                  component="div"
                                  className="text-orange-500 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 text-center">
                                  Borrar
                                </label>
                                <div className="flex items-center justify-center space-x-4">
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors duration-200"
                                    title="Eliminar participación"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-8 w-8"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FieldArray>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate("/partidos")}
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
