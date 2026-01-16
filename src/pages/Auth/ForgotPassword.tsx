// C:\apps\front-results\src\pages\Auth\ForgotPassword.tsx
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import LoadingButton from "../../components/LoadingButton";
import { useForgotPasswordMutation } from "../../store/auth/authEndpoints";

const ForgotPassword: React.FC = () => {
  const [forgotPassword] = useForgotPasswordMutation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialValues = { email: "" };

  const validationSchema = Yup.object({
    email: Yup.string()
      .trim()
      .email("Correo electrónico inválido")
      .required("El correo es obligatorio"),
  });

  const onSubmit = async (values: typeof initialValues) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      // Backend responde 200 siempre (si existe o no), por seguridad.
      await forgotPassword({ email: values.email.trim() }).unwrap();

      setSuccessMessage(
        "Si el correo está registrado, se enviaron instrucciones para restablecer la contraseña."
      );
    } catch (err: any) {
      // Si algo falla realmente (network, 5xx, etc.) sí mostramos error.
      const msg =
        err?.data?.message ||
        err?.message ||
        "No se pudo procesar la solicitud. Intente nuevamente.";
      setServerError(typeof msg === "string" ? msg : "No se pudo procesar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
      <div className="w-full max-w-[450px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 mb-4">
            <img
              src={tuvotoDecideImage}
              alt="Logo"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Recuperar contraseña
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {successMessage && (
          <div
            data-cy="forgot-success"
            className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 text-green-800 rounded-r-lg text-sm"
          >
            {successMessage}
          </div>
        )}

        {serverError && (
          <div
            data-cy="forgot-server-error"
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm"
          >
            {serverError}
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          <Form className="space-y-5">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                Correo
              </label>
              <Field
                name="email"
                data-cy="forgot-email"
                type="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
                placeholder="usuario@correo.com"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-xs text-red-500 mt-1 ml-1 font-medium"
              />
            </div>

            <div className="pt-2 space-y-3">
              <LoadingButton
                type="submit"
                data-cy="forgot-submit"
                isLoading={isSubmitting}
                style={{ backgroundColor: "#459151" }}
                className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#459151]/20 active:scale-[0.98]"
              >
                Enviar enlace
              </LoadingButton>

              <Link
                to="/login"
                className="block text-center w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                Volver a Iniciar sesión
              </Link>
            </div>
          </Form>
        </Formik>

        <div className="mt-6 text-xs text-gray-500 text-center">
          Si no ves el correo, revisa spam o correo no deseado.
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
