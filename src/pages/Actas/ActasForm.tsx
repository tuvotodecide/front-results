import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSubmitBallotMutation } from "../../store/actas/actasEndpoints";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import LoadingButton from "../../components/LoadingButton";
import Modal2 from "../../components/Modal2";
import ModalImage from "../../components/ModalImage";

interface FormValues {
  file: File | null;
  tableNumber: string;
  tableCode: string;
  citizenId: string;
  locationCode: string;
}

const validationSchema = Yup.object({
  file: Yup.mixed().required("La imagen es requerida"),
  tableNumber: Yup.string().required("El número de mesa es requerido"),
  tableCode: Yup.string().required("El código de mesa es requerido"),
  citizenId: Yup.string().required("El ID del ciudadano es requerido"),
  locationCode: Yup.string().required("El código de ubicación es requerido"),
});

const ActasForm: React.FC = () => {
  const [submitBallot] = useSubmitBallotMutation();
  const [serverResponse, setServerResponse] = useState<any>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const navigate = useNavigate();

  const initialValues: FormValues = {
    file: null,
    tableNumber: "",
    tableCode: "",
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
    formData.append("tableCode", values.locationCode);

    try {
      const resp = await submitBallot(formData).unwrap();
      console.log("Form submitted successfully:", resp);
      setServerResponse({ success: true, ...resp });

      resetForm();
      setPreviewUrl(null);
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error: any) {
      setServerResponse({ success: false, ...error?.data });
      console.error("Error submitting form:", error?.data);
    } finally {
      setIsModalOpen(true);
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
                  <ErrorMessage
                    name="file"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
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
                    Codigo de Mesa
                  </label>
                  <Field
                    name="tableCode"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="tableCode"
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
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    Enviar
                  </LoadingButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <Modal2
        isOpen={isModalOpen}
        type={serverResponse.success ? "success" : "error"}
        title={serverResponse.success ? "Acta subida" : "Error al subir acta"}
        onClose={() => setIsModalOpen(false)}
        size="md"
        className="bg-white rounded-lg shadow-lg"
      >
        <p className="text-gray-700 mb-4">{serverResponse.message}</p>
        {serverResponse.success && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Información del Acta:
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded ${
                      true
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {serverResponse.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tracking ID:</span>
                  <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded text-gray-800">
                    {serverResponse.trackingId}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/resultados/generales2"
                className="py-2 px-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 border relative bg-transparent text-green-700 hover:bg-green-50 border-green-500 w-full text-center"
              >
                Ver Resultados
              </Link>
              <Link
                to={`/resultados?trackingId=${serverResponse.trackingId}`}
                className="py-2 px-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 border relative bg-transparent text-blue-700 hover:bg-blue-50 border-blue-500 w-full text-center"
              >
                Ver Acta
              </Link>
            </div>
          </>
        )}
      </Modal2>

      <ModalImage
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        imageUrl={previewUrl}
      />
    </>
  );
};

export default ActasForm;
