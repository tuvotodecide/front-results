import React, { useState } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSubmitBallotMutation } from "../store/actas/actasEndpoints";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

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
      // Reset file input
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
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
          <h2 className="text-2xl font-bold text-center mb-6 text-red-600">
            Subir Acta
          </h2>
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full h-auto rounded"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="locationCode"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2 px-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-3 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Enviando...
                    </div>
                  ) : (
                    "Enviar"
                  )}
                </button>
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

      <style>
        {`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .modal-content {
            position: relative;
            outline: none;
          }
        `}
      </style>
    </>
  );
};

export default ActasForm;
