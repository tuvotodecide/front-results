import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useCreateUserMutation } from "../store/auth/authEndpoints";
import { useNavigate } from "react-router-dom";

const CrearCuenta: React.FC = () => {
  const navigate = useNavigate();
  const [createUser] = useCreateUserMutation();
  const [serverErrors, setServerErrors] = useState<string[]>([]); // State for server errors

  const registerUser = (user: any) => {
    setServerErrors([]); // Clear previous errors
    createUser(user)
      .unwrap()
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.log("Error", error);
        if (error?.data?.message) {
          setServerErrors(error.data.message); // Set server errors
        }
      });
  };
  const validationSchema = Yup.object({
    name: Yup.string().required("Este campo es obligatorio"),
    password: Yup.string().required("Este campo es obligatorio"),
    // email: Yup.string()
    //   .matches(/^\d+$/, "Debe ser un número")
    //   .required("Este campo es obligatorio"),
    // email: Yup.string()
    //   .matches(/^\d+$/, "Debe ser un número")
    //   .required("Este campo es obligatorio"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Este campo es obligatorio"),
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl p-8 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-left mb-6 text-red-600">
          Registrarse en Yo Participo
        </h1>
        {serverErrors.length > 0 && ( // Display server errors
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            <h2 className="font-bold mb-2">Errores:</h2>
            <ul className="list-disc pl-5">
              {serverErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <Formik
          initialValues={{
            name: "",
            password: "",
            email: "",
            userRol: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            registerUser(values);
          }}
        >
          {() => (
            <Form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nombre completo
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
                    htmlFor="userRol"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Rol del usuario
                  </label>
                  <Field
                    as="select"
                    id="userRol"
                    name="userRol"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="recinto1">Recinto 1</option>
                    <option value="recinto2">Recinto 2</option>
                  </Field>
                  <ErrorMessage
                    name="userRol"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="password"
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
    </div>
  );
};

export default CrearCuenta;
