import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const RegistroJurado: React.FC = () => {
  const validationSchema = Yup.object({
    nombres: Yup.string().required("Este campo es obligatorio"),
    apellidos: Yup.string().required("Este campo es obligatorio"),
    ci: Yup.string()
      .matches(/^\d+$/, "Debe ser un número")
      .required("Este campo es obligatorio"),
    recintoElectoral: Yup.string().required("Seleccione una opción"),
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl p-8 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-left mb-6 text-red-600">
          Registro de Jurados Electorales
        </h1>
        <Formik
          initialValues={{
            nombres: "",
            apellidos: "",
            ci: "",
            recintoElectoral: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            console.log(values);
          }}
        >
          {() => (
            <Form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="nombres"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nombres
                  </label>
                  <Field
                    id="nombres"
                    name="nombres"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="nombres"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="apellidos"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Apellidos
                  </label>
                  <Field
                    id="apellidos"
                    name="apellidos"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="apellidos"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="ci"
                    className="block text-sm font-medium text-gray-700"
                  >
                    CI
                  </label>
                  <Field
                    id="ci"
                    name="ci"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="ci"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="recintoElectoral"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Recinto Electoral
                  </label>
                  <Field
                    as="select"
                    id="recintoElectoral"
                    name="recintoElectoral"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="recinto1">Recinto 1</option>
                    <option value="recinto2">Recinto 2</option>
                  </Field>
                  <ErrorMessage
                    name="recintoElectoral"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="bg-gray-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-gray-600 mr-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      {/* <div className="max-w-6xl bg-white shadow-md rounded-lg p-6">
        
      </div> */}
    </div>
  );
};

export default RegistroJurado;
