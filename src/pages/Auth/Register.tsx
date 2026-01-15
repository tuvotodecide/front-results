import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useCreateUserMutation } from "../../store/auth/authEndpoints";
import { useNavigate } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import { Link } from "react-router-dom";

interface FormValues {
  name: string;
  password: string;
  confirmPassword: string;
  email: string;
  userRol: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [createUser] = useCreateUserMutation();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const registerUser = (values: FormValues) => {
    setServerErrors([]);
    setIsSubmitting(true);
    const { confirmPassword, ...dataToSend } = values;
    createUser(dataToSend as any)
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
    name: Yup.string().trim().required("El nombre completo es obligatorio"),
    email: Yup.string()
      .trim()
      .email("Correo electrónico inválido")
      .required("El correo es obligatorio"),
    password: Yup.string()
      .trim()
      .min(6, "Mínimo 6 caracteres")
      .required("La contraseña es obligatoria"),
    confirmPassword: Yup.string()
      .trim()
      .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
      .required("Debes confirmar tu contraseña"),
  });

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4 py-8">
      <div className="w-full max-w-[450px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 mb-4">
            <img
              src={tuvotoDecideImage}
              alt="Logo"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Registrarse
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Crea tu cuenta en Tu voto decide
          </p>
        </div>

        {serverErrors.length > 0 && (
          <div
            data-cy="register-server-errors"
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm"
          >
            <h2 className="font-bold mb-1">Hubo un problema:</h2>
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
            confirmPassword: "",
            email: "",
            userRol: "user", // Valor por defecto
          }}
          validationSchema={validationSchema}
          onSubmit={registerUser}
        >
          <Form className="space-y-5">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                Nombre completo
              </label>
              <Field
                data-cy="register-name"
                name="name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
              />
              <ErrorMessage
                name="name"
                component="div"
                className="text-xs text-red-500 mt-1 ml-1 font-medium"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                Correo
              </label>
              <Field
                name="email"
                data-cy="register-email"
                type="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-xs text-red-500 mt-1 ml-1 font-medium"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <Field
                  data-cy="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#459151]"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="text-xs text-red-500 mt-1 ml-1 font-medium"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                Repetir contraseña
              </label>
              <div className="relative">
                <Field
                  name="confirmPassword"
                  data-cy="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#459151]"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="text-xs text-red-500 mt-1 ml-1 font-medium"
              />
            </div>

            <div className="pt-4 space-y-3">
              <LoadingButton
                type="submit"
                data-cy="register-submit"
                isLoading={isSubmitting}
                style={{ backgroundColor: "#459151" }}
                className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#459151]/20 active:scale-[0.98]"
              >
                Registrarse
              </LoadingButton>

              <Link
                to="/login"
                className="block text-center w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                Regresar
              </Link>
            </div>
          </Form>
        </Formik>
      </div>
    </div>
  );
};
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
    />
  </svg>
);

export default Register;
