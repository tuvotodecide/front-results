import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initialValues: FormValues = {
    file: null,
    tableNumber: "",
    citizenId: "",
    locationCode: "",
  };

  const handleSubmit = (values: FormValues) => {
    console.log(values);
    // Handle form submission here
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
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Submit Acta</h2>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setFieldValue)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <Field
                  name="tableNumber"
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage
                  name="tableNumber"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Citizen ID
                </label>
                <Field
                  name="citizenId"
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage
                  name="citizenId"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Code
                </label>
                <Field
                  name="locationCode"
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage
                  name="locationCode"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Submit
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ActasForm;
