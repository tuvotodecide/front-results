"use client";

import { useState } from "react";
import Link from "next/link";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import LoadingButton from "@/components/LoadingButton";
import AuthCardLayout from "@/domains/auth/components/AuthCardLayout";
import { useForgotPasswordMutation } from "@/store/auth/authEndpoints";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { data?: { message?: string | string[] }; message?: string };
    const message = candidate.data?.message ?? candidate.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join("\n");
  }

  return fallback;
};

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Correo electrónico inválido")
    .required("El correo es obligatorio"),
});

export default function ForgotPasswordPage() {
  const [forgotPassword] = useForgotPasswordMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (values: { email: string }) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await forgotPassword({ email: values.email.trim() }).unwrap();
      setSuccessMessage(
        "Si el correo está registrado, se enviaron instrucciones para restablecer la contraseña.",
      );
    } catch (error: unknown) {
      setServerError(
        getErrorMessage(error, "No se pudo procesar la solicitud. Intente nuevamente."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña."
    >
      {successMessage && (
        <div
          data-cy="forgot-success"
          className="mb-6 rounded-r-lg border-l-4 border-green-600 bg-green-50 p-4 text-sm text-green-800"
        >
          {successMessage}
        </div>
      )}

      {serverError && (
        <div
          data-cy="forgot-server-error"
          className="mb-6 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <Formik initialValues={{ email: "" }} validationSchema={validationSchema} onSubmit={onSubmit}>
        <Form className="space-y-5">
          <div className="flex flex-col">
            <label className="mb-1 ml-1 text-sm font-semibold text-gray-700">Correo</label>
            <Field
              name="email"
              data-cy="forgot-email"
              type="email"
              placeholder="usuario@correo.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
            />
            <ErrorMessage
              name="email"
              component="div"
              className="ml-1 mt-1 text-xs font-medium text-red-500"
            />
          </div>

          <div className="space-y-3 pt-2">
            <LoadingButton
              type="submit"
              data-cy="forgot-submit"
              isLoading={isSubmitting}
              style={{ backgroundColor: "#459151" }}
              className="w-full rounded-xl py-3 font-bold text-white shadow-lg shadow-[#459151]/20 transition-all active:scale-[0.98]"
            >
              Enviar enlace
            </LoadingButton>

            <Link
              href="/login"
              className="block w-full rounded-xl border-2 border-gray-200 py-3 text-center font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
            >
              Volver a Iniciar sesión
            </Link>
          </div>
        </Form>
      </Formik>

      <div className="mt-6 text-center text-xs text-gray-500">
        Si no ves el correo, revisa spam o correo no deseado.
      </div>
    </AuthCardLayout>
  );
}
