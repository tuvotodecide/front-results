import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useCreateUserMutation } from "../../store/auth/authEndpoints";
import { useNavigate } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";
import BackButton from "../../components/BackButton";

interface FormValues {
  name: string;
  password: string;
  email: string;
  userRol: string;
}

const CrearCuenta: React.FC = () => {
  const navigate = useNavigate();
  const [createUser] = useCreateUserMutation();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerUser = (user: FormValues) => {
    setServerErrors([]);
    setIsSubmitting(true);
    createUser(user)
      .unwrap()
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        if (error?.data?.message) {
          setServerErrors(error.data.message);
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Este campo es obligatorio"),
    password: Yup.string().required("Este campo es obligatorio"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Este campo es obligatorio"),
  });

  return (
    <>
      <div className="flex h-full justify-center items-center">
        <div className="grow max-w-md p-8 bg-white rounded shadow-md">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-700 border-b pb-4 border-gray-300">
            Registrarse
          </h1>
          {serverErrors.length > 0 && (
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
            onSubmit={(values: FormValues) => {
              registerUser(values);
            }}
          >
            {() => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <Field
                    name="name"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Field
                    name="email"
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Field
                    name="password"
                    type="password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-sm text-red-500 mt-1"
                  />
                </div>

                <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    Registrarse
                  </LoadingButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default CrearCuenta;
