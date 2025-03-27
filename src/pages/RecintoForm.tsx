import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RecintoElectoral } from "../types/recintos";
import { useCreateRecintoMutation } from "../store/recintos/recintosEndpoints";
import { useNavigate } from "react-router-dom";

const RecintoForm: React.FC = () => {
  const [createRecinto, { isLoading, error }] = useCreateRecintoMutation();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    name: Yup.string().required("Este campo es obligatorio"),
    address: Yup.string().required("Este campo es obligatorio"),
    code: Yup.string().required("Este campo es obligatorio"),
    department: Yup.string().required("Este campo es obligatorio"),
    municipality: Yup.string().required("Este campo es obligatorio"),
    province: Yup.string().required("Este campo es obligatorio"),
    totalTables: Yup.number()
      .required("Este campo es obligatorio")
      .min(1, "Debe ser mayor a 0"),
    coordinates: Yup.object({
      latitude: Yup.number()
        .required("Latitud es obligatoria")
        .min(-90)
        .max(90),
      longitude: Yup.number()
        .required("Longitud es obligatoria")
        .min(-180)
        .max(180),
    }),
  });

  const initialValues = {
    name: "",
    address: "",
    code: "",
    department: "",
    municipality: "",
    province: "",
    totalTables: 0,
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    active: true,
  };

  const handleSubmit = async (
    values: Omit<RecintoElectoral, "_id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await createRecinto(values).unwrap();
      navigate("/recintos"); // Adjust this route according to your app's routing
    } catch (err) {
      console.error("Failed to create recinto:", err);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl p-8 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-left mb-6 text-red-600">
          Registro de Recinto Electoral
        </h1>
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error al crear el recinto. Por favor intente nuevamente.
          </div>
        )}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nombre del Recinto
                  </label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Código
                  </label>
                  <Field
                    id="code"
                    name="code"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="code"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dirección
                </label>
                <Field
                  id="address"
                  name="address"
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
                <ErrorMessage
                  name="address"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Departamento
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
                <div>
                  <label
                    htmlFor="province"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Provincia
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
                <div>
                  <label
                    htmlFor="municipality"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Municipio
                  </label>
                  <Field
                    id="municipality"
                    name="municipality"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="municipality"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="totalTables"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total de Mesas
                  </label>
                  <Field
                    id="totalTables"
                    name="totalTables"
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="totalTables"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="coordinates.latitude"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Latitud
                  </label>
                  <Field
                    id="coordinates.latitude"
                    name="coordinates.latitude"
                    type="number"
                    step="0.000001"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="coordinates.latitude"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="coordinates.longitude"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Longitud
                  </label>
                  <Field
                    id="coordinates.longitude"
                    name="coordinates.longitude"
                    type="number"
                    step="0.000001"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="coordinates.longitude"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
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
  );
};

export default RecintoForm;
