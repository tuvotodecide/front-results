"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import LoadingButton from "@/components/LoadingButton";
import Modal2 from "@/components/Modal2";
import type { ModalState } from "@/types/modalview";
import { resolveAuthenticatedDestination } from "@/domains/auth/lib/access";
import AuthCardLayout from "@/domains/auth/components/AuthCardLayout";
import { publicEnv } from "@/shared/env/public";
import { writePendingContext } from "@/shared/auth/storage";
import { selectAuth, setAuth } from "@/store/auth/authSlice";
import {
  type ProfileResponse,
  useLazyGetProfileQuery,
  useLoginUserMutation,
} from "@/store/auth/authEndpoints";

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
    .email("Correo electrónico inválido")
    .required("El correo es obligatorio"),
  password: Yup.string()
    .min(8, "Mínimo 8 caracteres")
    .required("La contraseña es obligatoria"),
});

const mapBackendRole = (
  role: string,
): "MAYOR" | "GOVERNOR" | "PUBLIC" | "SUPERADMIN" | "TENANT_ADMIN" => {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "MAYOR") return "MAYOR";
  if (normalized === "GOVERNOR") return "GOVERNOR";
  if (normalized === "SUPERADMIN") return "SUPERADMIN";
  if (normalized === "ADMIN" || normalized === "TENANT_ADMIN") return "TENANT_ADMIN";
  return "PUBLIC";
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useSelector(selectAuth);
  const from = useMemo(() => searchParams?.get("from") ?? null, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [loginUser, { isLoading: loggingIn }] = useLoginUserMutation();
  const [triggerProfile] = useLazyGetProfileQuery();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: "",
    message: "",
    kind: "info",
  });

  useEffect(() => {
    if (!user || !token) return;
    const target = resolveAuthenticatedDestination({
      user,
      appMode: publicEnv.appMode,
      from,
    });
    router.replace(target);
  }, [from, router, token, user]);

  const modalType: "success" | "error" | "info" =
    modal.kind === "success" ? "success" : modal.kind === "error" ? "error" : "info";

  const onSubmit = async (values: { email: string; password: string }) => {
    try {
      const response = await loginUser(values).unwrap();
      const accessToken = response.accessToken ?? response.access_token ?? response.token;
      if (!accessToken) {
        throw new Error("No se recibió token de acceso");
      }
      const isApproved = Boolean(response.active);
      const role = mapBackendRole(response.role ?? "");

      if (!isApproved) {
        writePendingContext({
          email: values.email,
          reason: "SUPERADMIN_APPROVAL",
        });
        dispatch(
          setAuth({
            access_token: accessToken,
            user: {
              id: "pending",
              email: values.email,
              name: "PENDIENTE",
              role,
              active: false,
              status: "PENDING",
            },
          }),
        );
        router.replace("/pendiente");
        return;
      }

      dispatch(setAuth({ access_token: accessToken }));

      let profile: ProfileResponse | null = null;
      try {
        profile = await triggerProfile().unwrap();
      } catch {
        profile = null;
      }

      dispatch(
        setAuth({
          access_token: accessToken,
          user: {
            id: profile?.sub ?? "unknown",
            email: values.email,
            name: "Usuario",
            role,
            active: true,
            departmentId: profile?.votingDepartmentId,
            municipalityId: profile?.votingMunicipalityId,
            tenantId: profile?.tenantId,
            status: "ACTIVE",
          },
        }),
      );
    } catch (error: unknown) {
      const msg = getErrorMessage(error, "No se pudo iniciar sesión");
      const normalized = msg.toLowerCase();

      if (normalized.includes("no ha sido verificado") || normalized.includes("no verificado")) {
        writePendingContext({ email: values.email, reason: "VERIFY_EMAIL" });
        router.replace("/pendiente");
        return;
      }

      if (
        normalized.includes("inactivo") ||
        normalized.includes("no está activo") ||
        normalized.includes("usuario inactivo") ||
        normalized.includes("pendiente de aprobación") ||
        normalized.includes("pendiente de aprobacion")
      ) {
        writePendingContext({ email: values.email, reason: "SUPERADMIN_APPROVAL" });
        router.replace("/pendiente");
        return;
      }

      const title = "No se pudo iniciar sesión";
      let message = msg || "Credenciales inválidas o error del servidor.";

      if (message.trim().toLowerCase() === title.trim().toLowerCase()) {
        message = "Verifica tu correo y contraseña e inténtalo nuevamente.";
      }

      setModal({
        open: true,
        title,
        message,
        kind: "error",
      });
    }
  };

  return (
    <>
      <AuthCardLayout title="Tu voto decide" subtitle="Ingresa tus credenciales">
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          <Form className="space-y-6">
            <div className="flex flex-col">
              <label className="mb-1.5 ml-1 text-sm font-semibold text-gray-700">Correo</label>
              <Field
                name="email"
                data-cy="login-email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition-all placeholder:text-gray-300 focus:border-transparent focus:ring-2 focus:ring-[#459151]"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="ml-1 mt-1.5 text-xs font-medium text-red-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1.5 ml-1 text-sm font-semibold text-gray-700">Contraseña</label>
              <div className="relative">
                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  data-cy="login-password"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#459151]"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="ml-1 mt-1.5 text-xs font-medium text-red-500"
              />
            </div>

            <div className="pt-2">
              <LoadingButton
                type="submit"
                data-cy="login-submit"
                disabled={loggingIn}
                style={{ backgroundColor: "#459151" }}
                className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg shadow-[#459151]/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Iniciar Sesión
              </LoadingButton>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="mx-4 flex-shrink text-xs uppercase tracking-widest text-gray-400">
                ¿No tienes una cuenta?
              </span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <div className="text-center">
              <Link
                href="/registrarse"
                style={{ borderColor: "#459151", color: "#459151" }}
                className="inline-block w-full rounded-xl border-2 py-3 font-bold transition-all hover:bg-[#459151]/5 active:scale-[0.98]"
              >
                Crear cuenta
              </Link>
            </div>

            <div className="-mt-2 flex justify-between">
              <div className="text-left">
                <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-[#459151]">
                  Volver al inicio
                </Link>
              </div>
              <div className="text-right">
                <Link
                  href="/recuperar"
                  className="text-sm font-semibold text-gray-500 hover:text-[#459151]"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          </Form>
        </Formik>
      </AuthCardLayout>

      <Modal2
        isOpen={modal.open}
        onClose={() => setModal((current) => ({ ...current, open: false }))}
        title={modal.title}
        size="sm"
        type={modalType}
      >
        <div className="space-y-4">
          <p className="whitespace-pre-line text-sm text-gray-700">{modal.message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModal((current) => ({ ...current, open: false }))}
              className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal2>
    </>
  );
}

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3l18 18M10.477 10.486A3 3 0 0013.5 13.5m-9.463-1.178a10.477 10.477 0 011.934-3.546m3.094-2.665A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L9.88 9.88"
    />
  </svg>
);
