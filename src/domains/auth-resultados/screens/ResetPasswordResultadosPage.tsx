"use client";

import { useEffect, useMemo, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import tuvotoDecideImage from "../../../assets/tuvotodecide.webp";
import { Link, useNavigate, useSearchParams } from "../navigation/compat";
import LoadingButton from "../../../components/LoadingButton";
import { useResetPasswordMutation } from "../../../store/auth/authEndpoints";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/auth/authSlice";
import { resolveAuthResultadosRedirect } from "../utils/resolveAuthRedirect";

type ResetValues = {
  password: string;
  confirmPassword: string;
};

const getLogoSrc = () => {
  const logoAsset = tuvotoDecideImage as string | { src: string };
  return typeof logoAsset === "string" ? logoAsset : logoAsset.src;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const cleanMessage = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes("expir")) {
      return "El enlace de recuperación ya expiró. Solicita uno nuevo.";
    }

    if (normalized.includes("token")) {
      return "El enlace de recuperación no es válido. Solicita uno nuevo.";
    }

    return message;
  };

  if (typeof error === "object" && error !== null) {
    const maybeData = "data" in error ? error.data : undefined;
    if (
      typeof maybeData === "object" &&
      maybeData !== null &&
      "message" in maybeData
    ) {
      const message = maybeData.message;
      if (typeof message === "string") {
        return cleanMessage(message);
      }
    }

    if ("message" in error && typeof error.message === "string") {
      return cleanMessage(error.message);
    }
  }

  return fallback;
};

const ResetPasswordResultadosPage = () => {
  const logoSrc = getLogoSrc();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const navigate = useNavigate();
  const { user, token: authToken } = useSelector(selectAuth);
  const [resetPassword] = useResetPasswordMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const target = resolveAuthResultadosRedirect(user, authToken);
    if (target) {
      navigate(target, { replace: true });
    }
  }, [user, authToken, navigate]);

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

  const onSubmit = async (values: ResetValues) => {
    setServerError(null);

    if (!token) {
      setServerError(
        "El enlace es inválido o está incompleto. Abre nuevamente el enlace enviado a tu correo.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      navigate("/resultados/login", { replace: true });
    } catch (error) {
      setServerError(
        getErrorMessage(error, "No se pudo restablecer la contraseña."),
      );
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
              src={logoSrc}
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
            El enlace es inválido o está incompleto. Abre nuevamente el enlace
            enviado a tu correo.
          </div>
        )}

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm">
            {serverError}
          </div>
        )}

        <Formik<ResetValues>
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
                to="/resultados/login"
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

export default ResetPasswordResultadosPage;
