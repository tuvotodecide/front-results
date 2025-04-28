import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSubmitBallotMutation } from "../../store/actas/actasEndpoints";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import LoadingButton from "../../components/LoadingButton";
import Modal from "../../components/Modal";
import ModalImage from "../../components/ModalImage";

interface FormValues {
  file: File | null;
  tableNumber: string;
  citizenId: string;
  locationCode: string;
}

const validationSchema = Yup.object({
  tableNumber: Yup.string().required("Table number is required"),
  citizenId: Yup.string().required("Citizen ID is required"),
  locationCode: Yup.string().required("Location code is required"),
});

const ActasForm: React.FC = () => {
  const [submitBallot] = useSubmitBallotMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const navigate = useNavigate();

  const initialValues: FormValues = {
    file: null,
    tableNumber: "",
    citizenId: "",
    locationCode: "",
  };

  const handleSubmit = async (
    values: FormValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    setIsSubmitting(true);
    const formData = new FormData();
    if (values.file) {
      formData.append("file", values.file);
    }
    formData.append("tableNumber", values.tableNumber);
    formData.append("citizenId", values.citizenId);
    formData.append("locationCode", values.locationCode);

    try {
      await submitBallot(formData).unwrap();
      setIsModalOpen(true);
      resetForm();
      setPreviewUrl(null);
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
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
      <div className="flex h-full justify-center items-center">
        <div className="grow max-w-md p-8 bg-white rounded shadow-md">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-700 border-b pb-4 border-gray-300">
            Subir Acta
          </h1>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cargar Imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setFieldValue)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
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
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Numero de la Mesa
                  </label>
                  <Field
                    name="tableNumber"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="tableNumber"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carnet de identidad del ciudadano
                  </label>
                  <Field
                    name="citizenId"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="citizenId"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Codigo del Recinto
                  </label>
                  <Field
                    name="locationCode"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="locationCode"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>
                <div className=" flex justify-center mt-6 pt-6 border-t border-gray-300">
                  <LoadingButton type="submit" isLoading={isSubmitting}>
                    Enviar
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
        size="md"
      >
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
      </Modal>

      <ModalImage
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        imageUrl={previewUrl}
      />
    </>
  );
};

export default ActasForm;
