import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";
import BackButton from "../../components/BackButton";

const RegistroJurado: React.FC = () => {
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    nombres: Yup.string().required("Este campo es obligatorio"),
    apellidos: Yup.string().required("Este campo es obligatorio"),
    ci: Yup.string()
      .matches(/^\d+$/, "Debe ser un número")
      .required("Este campo es obligatorio"),
    recintoElectoral: Yup.string().required("Seleccione una opción"),
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center mb-8 border-b pb-4 border-gray-300">
          <BackButton className="mr-4" />
          <h1 className="text-2xl font-bold text-gray-700">
            Registro de Jurado Electoral
          </h1>
        </div>

        <Formik
          initialValues={{
            nombres: "",
            apellidos: "",
            ci: "",
            recintoElectoral: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            console.log(values);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="nombres"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombres
                  </label>
                  <Field
                    id="nombres"
                    name="nombres"
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  />
                  <ErrorMessage
                    name="nombres"
                    component="div"
                    className="text-orange-600 text-sm mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="apellidos"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Apellidos
                  </label>
                  <Field
                    id="apellidos"
                    name="apellidos"
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  />
                  <ErrorMessage
                    name="apellidos"
                    component="div"
                    className="text-orange-600 text-sm mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ci"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    CI
                  </label>
                  <Field
                    id="ci"
                    name="ci"
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  />
                  <ErrorMessage
                    name="ci"
                    component="div"
                    className="text-orange-600 text-sm mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="recintoElectoral"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Recinto Electoral
                  </label>
                  <Field
                    as="select"
                    id="recintoElectoral"
                    name="recintoElectoral"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="recinto1">Recinto 1</option>
                    <option value="recinto2">Recinto 2</option>
                  </Field>
                  <ErrorMessage
                    name="recintoElectoral"
                    component="div"
                    className="text-orange-600 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => navigate("/jurados")}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <LoadingButton type="submit" isLoading={isSubmitting}>
                  Guardar
                </LoadingButton>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default RegistroJurado;
