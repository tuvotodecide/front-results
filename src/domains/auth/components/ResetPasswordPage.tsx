"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import LoadingButton from "@/components/LoadingButton";
import AuthCardLayout from "@/domains/auth/components/AuthCardLayout";
import { useResetPasswordMutation } from "@/store/auth/authEndpoints";

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
  password: Yup.string()
    .trim()
    .min(8, "Mínimo 8 caracteres")
    .required("La contraseña es obligatoria"),
  confirmPassword: Yup.string()
    .trim()
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
    .required("Debes confirmar tu contraseña"),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token") ?? "", [searchParams]);
  const [resetPassword] = useResetPasswordMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (values: { password: string; confirmPassword: string }) => {
    setServerError(null);
    if (!token) {
      setServerError("Token inválido o faltante.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      router.replace("/login");
    } catch (error: unknown) {
      setServerError(getErrorMessage(error, "No se pudo restablecer la contraseña."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      title="Restablecer contraseña"
      subtitle="Crea una nueva contraseña para tu cuenta."
    >
      {!token && (
        <div className="mb-6 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
          Token inválido o faltante. Abre el enlace enviado a tu correo.
        </div>
      )}

      {serverError && (
        <div className="mb-6 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        <Form className="space-y-5">
          <div className="flex flex-col">
            <label className="mb-1 ml-1 text-sm font-semibold text-gray-700">Nueva contraseña</label>
            <Field
              name="password"
              data-cy="reset-password"
              type="password"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
            />
            <ErrorMessage
              name="password"
              component="div"
              className="ml-1 mt-1 text-xs font-medium text-red-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 ml-1 text-sm font-semibold text-gray-700">Confirmar contraseña</label>
            <Field
              name="confirmPassword"
              data-cy="reset-confirm"
              type="password"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
            />
            <ErrorMessage
              name="confirmPassword"
              component="div"
              className="ml-1 mt-1 text-xs font-medium text-red-500"
            />
          </div>

          <div className="space-y-3 pt-2">
            <LoadingButton
              type="submit"
              data-cy="reset-submit"
              isLoading={isSubmitting}
              style={{ backgroundColor: "#459151" }}
              className="w-full rounded-xl py-3 font-bold text-white shadow-lg shadow-[#459151]/20 transition-all active:scale-[0.98]"
              disabled={!token}
            >
              Guardar contraseña
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
    </AuthCardLayout>
  );
}
