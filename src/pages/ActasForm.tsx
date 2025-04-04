import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSubmitBallotMutation } from "../store/actas/actasEndpoints";

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

  const initialValues: FormValues = {
    file: null,
    tableNumber: "",
    citizenId: "",
    locationCode: "",
  };

  const handleSubmit = async (values: FormValues) => {
    const formData = new FormData();
    if (values.file) {
      formData.append("file", values.file);
    }
    formData.append("tableNumber", values.tableNumber);
    formData.append("citizenId", values.citizenId);
    formData.append("locationCode", values.locationCode);

    try {
      await submitBallot(formData).unwrap();
      // Clear the form or show success message
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle error here
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
                className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Enviar
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ActasForm;
