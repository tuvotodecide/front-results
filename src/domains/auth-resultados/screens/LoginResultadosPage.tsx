"use client";

import { useEffect, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import tuvotoDecideImage from "../../../assets/tuvotodecide.webp";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "../navigation/compat";
import { ModalState } from "../../../types";
import Modal2 from "../../../components/Modal2";
import LoadingButton from "../../../components/LoadingButton";
import {
  useLazyGetProfileQuery,
  useLoginUserMutation,
} from "../../../store/auth/authEndpoints";
import {
  selectAuth,
  setAuth,
  type AuthState,
} from "../../../store/auth/authSlice";

type LoginValues = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken?: string;
  role?: string;
  active?: boolean;
};

type ProfileResponse = {
  sub?: string;
  votingDepartmentId?: string;
  votingMunicipalityId?: string;
  tenantId?: string;
};

type RouteState = {
  from?: string;
};

type AuthResultsRole =
  | "MAYOR"
  | "GOVERNOR"
  | "publico"
  | "SUPERADMIN"
  | "TENANT_ADMIN";

const getLogoSrc = () => {
  const logoAsset = tuvotoDecideImage as string | { src: string };
  return typeof logoAsset === "string" ? logoAsset : logoAsset.src;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const maybeData = "data" in error ? error.data : undefined;
    if (
      typeof maybeData === "object" &&
      maybeData !== null &&
      "message" in maybeData
    ) {
      const message = maybeData.message;
      if (typeof message === "string") {
        return message;
      }
    }

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }

  return fallback;
};

export const mapBackendRole = (role: string): AuthResultsRole => {
  const r = String(role || "").toUpperCase();

  if (r === "MAYOR") return "MAYOR";
  if (r === "GOVERNOR") return "GOVERNOR";
  if (r === "SUPERADMIN") return "SUPERADMIN";
  if (r === "ADMIN" || r === "TENANT_ADMIN") return "TENANT_ADMIN";

  return "publico";
};

export const loginResultadosValidationSchema = Yup.object({
  email: Yup.string()
    .email("Correo electrónico inválido")
    .required("El correo es obligatorio"),
  password: Yup.string()
    .min(8, "Mínimo 8 caracteres")
    .required("La contraseña es obligatoria"),
});

const LoginResultadosPage = () => {
  const logoSrc = getLogoSrc();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, token } = useSelector(selectAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [loginUser, { isLoading: loggingIn }] = useLoginUserMutation();
  const [triggerProfile] = useLazyGetProfileQuery();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: "",
    message: "",
    kind: "info",
  });

  const modalType: "success" | "error" | "info" =
    modal.kind === "success"
      ? "success"
      : modal.kind === "error"
        ? "error"
        : "info";

  useEffect(() => {
    if (user && token) {
      const status = user.status ?? (user.active ? "ACTIVE" : "PENDING");

      if (status === "PENDING") {
        navigate("/resultados/pendiente", { replace: true });
        return;
      }

      if (status === "REJECTED" || status === "INACTIVE") {
        navigate("/resultados/rechazado", { replace: true });
        return;
      }

      const from =
        searchParams.get("from") ||
        (location.state as RouteState | null)?.from ||
        "";
      if (from && from !== "/resultados/login" && from !== "/login") {
        navigate(from, { replace: true });
        return;
      }

      if (user.role === "publico") {
        navigate("/resultados", { replace: true });
      } else if (user.role === "TENANT_ADMIN") {
        navigate("/votacion/elecciones", { replace: true });
      } else if (user.role === "MAYOR" && user.municipalityId) {
        navigate(
          `/resultados?department=${user.departmentId}&municipality=${user.municipalityId}`,
          { replace: true },
        );
      } else if (user.role === "GOVERNOR" && user.departmentId) {
        navigate(`/resultados?department=${user.departmentId}`, {
          replace: true,
        });
      } else if (user.role === "SUPERADMIN") {
        navigate("/votacion/elecciones", { replace: true });
      } else {
        navigate("/resultados", { replace: true });
      }
    }
  }, [user, token, navigate, location, searchParams]);

  const closeModal = () => setModal((current) => ({ ...current, open: false }));

  const openModal = (payload: Omit<ModalState, "open">) =>
    setModal({ open: true, ...payload });

  const onSubmit = async (values: LoginValues) => {
    try {
      const res = (await loginUser(values).unwrap()) as LoginResponse;

      const access_token = res.accessToken as string;
      const isApproved = Boolean(res.active);
      const role = mapBackendRole(res.role ?? "");

      if (!isApproved) {
        dispatch(
          setAuth({
            access_token,
            user: {
              id: "pending",
              email: values.email,
              name: "PENDIENTE",
              role,
              active: false,
              status: "PENDING",
            } satisfies NonNullable<AuthState["user"]>,
          }),
        );
        navigate("/resultados/pendiente", { replace: true });
        return;
      }

      dispatch(setAuth({ access_token }));

      let profile: ProfileResponse | null = null;
      try {
        profile = (await triggerProfile().unwrap()) as ProfileResponse;
      } catch {
        profile = null;
      }

      const profileUser = {
        id: profile?.sub ?? "unknown",
        email: values.email,
        name: "Usuario",
        role,
        active: true,
        departmentId: profile?.votingDepartmentId,
        municipalityId: profile?.votingMunicipalityId,
        tenantId: profile?.tenantId,
        status: "ACTIVE" as const,
      };

      dispatch(setAuth({ access_token, user: profileUser }));
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No se pudo iniciar sesión",
      ).toLowerCase();

      localStorage.setItem("pendingEmail", values.email);

      if (
        message.includes("no ha sido verificado") ||
        message.includes("no verificado")
      ) {
        localStorage.setItem("pendingReason", "VERIFY_EMAIL");
        navigate("/resultados/pendiente", { replace: true });
        return;
      }

      if (
        message.includes("inactivo") ||
        message.includes("no está activo") ||
        message.includes("usuario inactivo") ||
        message.includes("pendiente de aprobación") ||
        message.includes("pendiente de aprobacion")
      ) {
        localStorage.setItem("pendingReason", "SUPERADMIN_APPROVAL");
        navigate("/resultados/pendiente", { replace: true });
        return;
      }

      const title = "No se pudo iniciar sesión";
      let modalMessage = getErrorMessage(
        error,
        "Credenciales inválidas o error del servidor.",
      );

      if (
        modalMessage.trim().toLowerCase() === title.trim().toLowerCase()
      ) {
        modalMessage =
          "Verifica tu correo y contraseña e inténtalo nuevamente.";
      }

      openModal({ kind: "error", title, message: modalMessage });
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
        <div className="w-full max-w-[420px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 transition-all">
          <div className="flex flex-col items-center mb-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 mb-4">
              <img
                src={logoSrc}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Tu voto decide
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Ingresa tus credenciales
            </p>
          </div>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={loginResultadosValidationSchema}
            onSubmit={onSubmit}
          >
            <Form className="space-y-6">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Correo
                </label>
                <Field
                  name="email"
                  data-cy="login-email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-xs text-red-500 mt-1.5 ml-1 font-medium"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Field
                    type={showPassword ? "text" : "password"}
                    data-cy="login-password"
                    name="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#459151] transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-xs text-red-500 mt-1.5 ml-1 font-medium"
                />
              </div>

              <div className="pt-2">
                <LoadingButton
                  type="submit"
                  data-cy="login-submit"
                  disabled={loggingIn}
                  style={{ backgroundColor: "#459151" }}
                  className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#459151]/20 hover:brightness-110 active:scale-[0.98]"
                >
                  Iniciar Sesión
                </LoadingButton>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-widest">
                  ¿No tienes una cuenta?
                </span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <div className="text-center">
                <Link
                  to="/resultados/registrarse"
                  style={{ borderColor: "#459151", color: "#459151" }}
                  className="inline-block w-full py-3 border-2 font-bold rounded-xl transition-all hover:bg-[#459151]/5 active:scale-[0.98]"
                >
                  Crear cuenta
                </Link>
              </div>
              <div className="flex justify-between">
                <div className="text-left -mt-2">
                  <Link
                    to="/resultados"
                    className="text-sm font-semibold text-gray-500 hover:text-[#459151]"
                  >
                    Volver al inicio
                  </Link>
                </div>
                <div className="text-right -mt-2">
                  <Link
                    to="/resultados/recuperar"
                    className="text-sm font-semibold text-gray-500 hover:text-[#459151]"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>
            </Form>
          </Formik>
        </div>
      </div>
      <Modal2
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.title}
        size="sm"
        type={modalType}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {modal.message}
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal2>
    </>
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

export default LoginResultadosPage;
