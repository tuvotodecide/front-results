import React, { useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import LoadingButton from "../../components/LoadingButton";
import { useResetPasswordMutation } from "../../store/auth/authEndpoints";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const navigate = useNavigate();
  const [resetPassword] = useResetPasswordMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

  const onSubmit = async (values: { password: string; confirmPassword: string }) => {
    setServerError(null);

    if (!token) {
      setServerError("Token inválido o faltante.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      navigate("/login", { replace: true });
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "No se pudo restablecer la contraseña.";
      setServerError(typeof msg === "string" ? msg : "No se pudo restablecer.");
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
            Restablecer contraseña
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Crea una nueva contraseña para tu cuenta.
          </p>
        </div>

        {!token && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm">
            Token inválido o faltante. Abre el enlace enviado a tu correo.
          </div>
        )}

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm">
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
              <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                Nueva contraseña
              </label>
              <Field
                name="password"
                data-cy="reset-password"
                type="password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
              />
              <ErrorMessage
                name="password"
                component="div"
                className="text-xs text-red-500 mt-1 ml-1 font-medium"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                Confirmar contraseña
              </label>
              <Field
                name="confirmPassword"
                data-cy="reset-confirm"
                type="password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
              />
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="text-xs text-red-500 mt-1 ml-1 font-medium"
              />
            </div>

            <div className="pt-2 space-y-3">
              <LoadingButton
                type="submit"
                data-cy="reset-submit"
                isLoading={isSubmitting}
                style={{ backgroundColor: "#459151" }}
                className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#459151]/20 active:scale-[0.98]"
                disabled={!token}
              >
                Guardar contraseña
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
      </div>
    </div>
  );
};

export default ResetPassword;
