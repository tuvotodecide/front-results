"use client";

import { useEffect, useState } from "react";
import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  type FormikHelpers,
  useFormikContext,
} from "formik";
import * as Yup from "yup";
import tuvotoDecideImage from "../../../assets/tuvotodecide.webp";
import {
  useCreateUserMutation,
} from "../../../store/auth/authEndpoints";
import { Link, useNavigate, useSearchParams } from "../navigation/compat";
import LoadingButton from "../../../components/LoadingButton";
import ScopePicker from "../../../components/ScopePicker";
import Modal2 from "../../../components/Modal2";
import { useGetDepartmentsQuery } from "../../../store/departments/departmentsEndpoints";
import { ModalState } from "../../../types";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, type AccessStatus, setAuth } from "@/store/auth/authSlice";
import { resolveAuthResultadosRedirect } from "../utils/resolveAuthRedirect";
import { resolveRegisterPrefill } from "@/domains/auth-context/registerPrefill";
import { setDepartments } from "@/store/departments/departmentsSlice";

interface ResultsFormValues {
  dni: string;
  name: string;
  password: string;
  confirmPassword: string;
  email: string;
  roleType: "MAYOR" | "GOVERNOR";
  votingDepartmentId: string;
  votingMunicipalityId: string;
  scopeDepartmentId: string;
  scopeProvinceId: string;
  scopeMunicipalityId: string;
}

type ScopeChange = {
  departmentId?: string;
  provinceId?: string;
  municipalityId?: string;
};

type RegisterPayload = {
  dni: string;
  name: string;
  email: string;
  password?: string;
  votingDepartmentId?: string;
  votingMunicipalityId?: string;
};

const EMPTY_TENANT_ACCESS: AccessStatus["tenant"] = {
  hasApprovedAccess: false,
  latestStatus: null,
  canRequest: true,
  shouldSelectTenantContext: false,
  message: "",
  items: [],
};

const TERRITORIAL_PENDING_MESSAGES: Record<
  Exclude<AccessStatus["territorial"]["status"], "APPROVED" | "NONE">,
  string
> = {
  PENDING_EMAIL_VERIFICATION:
    "Revisa tu correo y completa la verificación para continuar con el proceso territorial.",
  PENDING_APPROVAL:
    "Tu solicitud de acceso territorial ya fue recibida y sigue en revisión.",
  REJECTED: "La solicitud territorial fue rechazada.",
  REVOKED: "El acceso territorial fue revocado.",
};

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
      if (Array.isArray(message)) {
        return message.join("\n");
      }
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

const buildValidationSchema = (requiresPassword: boolean) =>
  Yup.object({
    dni: Yup.string().trim().required("El carnet es obligatorio"),
    name: Yup.string().trim().required("El nombre completo es obligatorio"),
    email: Yup.string()
      .trim()
      .email("Correo electrónico inválido")
      .required("El correo es obligatorio"),
    password: requiresPassword
      ? Yup.string()
          .trim()
          .min(8, "Mínimo 8 caracteres")
          .required("La contraseña es obligatoria")
      : Yup.string().trim().notRequired(),
    confirmPassword: requiresPassword
      ? Yup.string()
          .trim()
          .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
          .required("Debes confirmar tu contraseña")
      : Yup.string().trim().notRequired(),
    roleType: Yup.mixed<"MAYOR" | "GOVERNOR">()
      .oneOf(["MAYOR", "GOVERNOR"])
      .required(),
    votingDepartmentId: Yup.string().when("roleType", {
      is: "GOVERNOR",
      then: (schema) => schema.required("Debes seleccionar un departamento"),
      otherwise: (schema) => schema.notRequired(),
    }),
    votingMunicipalityId: Yup.string().when("roleType", {
      is: "MAYOR",
      then: (schema) => schema.required("Debes seleccionar un municipio"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

export const registerResultadosValidationSchema = buildValidationSchema(true);

function RoleTypeWatcher() {
  const { values, setFieldValue } = useFormikContext<ResultsFormValues>();

  useEffect(() => {
    setFieldValue("votingDepartmentId", "");
    setFieldValue("votingMunicipalityId", "");
    setFieldValue("scopeDepartmentId", "");
    setFieldValue("scopeProvinceId", "");
    setFieldValue("scopeMunicipalityId", "");
  }, [values.roleType, setFieldValue]);

  return null;
}

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

const RegisterResultadosPage = () => {
  const logoSrc = getLogoSrc();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const { user, token } = auth;
  const prefill = resolveRegisterPrefill(searchParams, user);
  const isExistingIdentityFlow = prefill.hasExistingIdentity;
  const [createUser] = useCreateUserMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    data: departmentsResponse,
    isLoading: depLoading,
    isError: depError,
    refetch: refetchDepartments,
  } = useGetDepartmentsQuery({ limit: 100 }, { skip: false });

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

  const closeModal = () => setModal((current) => ({ ...current, open: false }));
  const openModal = (payload: Omit<ModalState, "open">) =>
    setModal({ open: true, ...payload });

  useEffect(() => {
    const target = resolveAuthResultadosRedirect(user, token, auth);
    if (target) {
      navigate(target, { replace: true });
    }
  }, [auth, user, token, navigate]);

  useEffect(() => {
    if (Array.isArray(departmentsResponse?.data)) {
      dispatch(setDepartments(departmentsResponse.data));
    }
  }, [departmentsResponse, dispatch]);

  const validationSchema = buildValidationSchema(!isExistingIdentityFlow);
  const formPrefillKey = [
    prefill.dni,
    prefill.name,
    prefill.email,
    isExistingIdentityFlow ? "cross-access" : "new-access",
  ].join("::");

  const registerResultsUser = async (
    values: ResultsFormValues,
    helpers: FormikHelpers<ResultsFormValues>,
  ) => {
    setIsSubmitting(true);

    const payload: RegisterPayload = {
      dni: values.dni,
      name: values.name,
      email: values.email,
      ...(isExistingIdentityFlow || !values.password.trim()
        ? {}
        : { password: values.password }),
      ...(values.roleType === "GOVERNOR"
        ? { votingDepartmentId: values.votingDepartmentId }
        : { votingMunicipalityId: values.votingMunicipalityId }),
    };

    try {
      const response = await createUser(payload).unwrap();
      const responseUser =
        typeof response === "object" && response !== null && "user" in response
          ? response.user
          : response;
      const territorialStatus =
        responseUser?.territorialAccessStatus ??
        responseUser?.accessStatus?.territorial?.status ??
        (isExistingIdentityFlow ? "PENDING_APPROVAL" : "PENDING_EMAIL_VERIFICATION");
      const requestedRole =
        responseUser?.territorialRequestedRole ??
        responseUser?.accessStatus?.territorial?.requestedRole ??
        responseUser?.role ??
        values.roleType;
      const mergedAccessStatus: AccessStatus = {
        tenant: auth.accessStatus?.tenant ?? EMPTY_TENANT_ACCESS,
        territorial: {
          hasApprovedAccess: territorialStatus === "APPROVED",
          status: territorialStatus,
          requestedRole,
          votingDepartmentId:
            responseUser?.votingDepartmentId ??
            responseUser?.departmentId ??
            (values.roleType === "GOVERNOR" ? values.votingDepartmentId : null),
          votingMunicipalityId:
            responseUser?.votingMunicipalityId ??
            responseUser?.municipalityId ??
            (values.roleType === "MAYOR" ? values.votingMunicipalityId : null),
          reason:
            responseUser?.territorialAccessReason ??
            responseUser?.accessStatus?.territorial?.reason ??
            auth.accessStatus?.territorial.reason ??
            null,
          canRequest:
            territorialStatus === "NONE" ||
            territorialStatus === "REJECTED" ||
            territorialStatus === "REVOKED",
          message:
            responseUser?.accessStatus?.territorial?.message ??
            auth.accessStatus?.territorial.message ??
            (territorialStatus === "APPROVED" || territorialStatus === "NONE"
              ? ""
              : TERRITORIAL_PENDING_MESSAGES[
                  territorialStatus as keyof typeof TERRITORIAL_PENDING_MESSAGES
                ]),
        },
      };

      if (token && user) {
        dispatch(
          setAuth({
            access_token: auth.accessToken ?? token,
            role: auth.role,
            active: auth.active,
            tenantId: auth.tenantId ?? user.tenantId ?? null,
            availableContexts: auth.availableContexts,
            requiresContextSelection: auth.requiresContextSelection,
            defaultContext: auth.defaultContext,
            activeContext: auth.activeContext,
            accessStatus: mergedAccessStatus,
            user: {
              ...user,
              dni: responseUser?.dni ?? values.dni ?? user.dni,
              email: responseUser?.email ?? values.email ?? user.email,
              name: responseUser?.name ?? values.name ?? user.name,
              departmentId:
                responseUser?.departmentId ?? user.departmentId,
              departmentName:
                responseUser?.departmentName ?? user.departmentName,
              municipalityId:
                responseUser?.municipalityId ?? user.municipalityId,
              municipalityName:
                responseUser?.municipalityName ?? user.municipalityName,
              territorialAccessStatus: territorialStatus,
              territorialAccessReason:
                responseUser?.territorialAccessReason ??
                responseUser?.accessStatus?.territorial?.reason ??
                mergedAccessStatus.territorial.message ??
                null,
              territorialRequestedRole: requestedRole,
            },
          }),
        );
      }

      localStorage.setItem("pendingEmail", payload.email);
      localStorage.setItem(
        "pendingReason",
        territorialStatus === "PENDING_EMAIL_VERIFICATION"
          ? "VERIFY_EMAIL"
          : "SUPERADMIN_APPROVAL",
      );
      navigate("/resultados/pendiente", { replace: true });
    } catch (error) {
      openModal({
        kind: "error",
        title: "Hubo un problema",
        message: getErrorMessage(error, "No se pudo registrar"),
      });
    } finally {
      setIsSubmitting(false);
      helpers.setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4 py-8">
        <div className="w-full max-w-[450px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 transition-all">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 mb-4">
              <img
                src={logoSrc}
                alt="Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              {isExistingIdentityFlow ? "Acceso territorial" : "Registrarse"}
            </h1>
            <p className="text-gray-500 text-sm mt-1 text-center">
              {isExistingIdentityFlow
                ? "Usaremos tu identidad existente para solicitar acceso territorial."
                : "Crea tu cuenta en Tu voto decide"}
            </p>
          </div>

          <Formik<ResultsFormValues>
            key={formPrefillKey}
            initialValues={{
              dni: prefill.dni,
              name: prefill.name,
              password: "",
              confirmPassword: "",
              email: prefill.email,
              roleType: "MAYOR",
              votingDepartmentId: "",
              votingMunicipalityId: "",
              scopeDepartmentId: "",
              scopeProvinceId: "",
              scopeMunicipalityId: "",
            }}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={registerResultsUser}
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-5" autoComplete="off">
                <RoleTypeWatcher />

                {isExistingIdentityFlow ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    Estás ampliando el acceso de tu usuario existente. Los datos
                    básicos se cargaron automáticamente y no necesitas crear
                    otra contraseña.
                  </div>
                ) : null}

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Carnet
                  </label>
                  <Field
                    name="dni"
                    data-cy="register-dni"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#459151] focus:border-transparent outline-none transition-all"
                  />
                  <ErrorMessage
                    name="dni"
                    component="div"
                    className="text-xs text-red-500 mt-1 ml-1 font-medium"
                  />
                </div>

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

                {!isExistingIdentityFlow ? (
                  <>
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
                          onMouseDown={(event) => event.preventDefault()}
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
                          onMouseDown={(event) => event.preventDefault()}
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
                  </>
                ) : null}

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Tipo de cuenta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFieldValue("roleType", "MAYOR");
                        setFieldValue("votingDepartmentId", "");
                        setFieldValue("votingMunicipalityId", "");
                        setFieldValue("scopeDepartmentId", "");
                        setFieldValue("scopeProvinceId", "");
                        setFieldValue("scopeMunicipalityId", "");
                      }}
                      className={`py-3 rounded-xl border font-semibold transition ${
                        values.roleType === "MAYOR"
                          ? "border-[#459151] bg-green-50 text-[#459151]"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Alcalde (Municipio)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFieldValue("roleType", "GOVERNOR");
                        setFieldValue("votingDepartmentId", "");
                        setFieldValue("votingMunicipalityId", "");
                        setFieldValue("scopeDepartmentId", "");
                        setFieldValue("scopeProvinceId", "");
                        setFieldValue("scopeMunicipalityId", "");
                      }}
                      className={`py-3 rounded-xl border font-semibold transition ${
                        values.roleType === "GOVERNOR"
                          ? "border-[#459151] bg-green-50 text-[#459151]"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Gobernador (Departamento)
                    </button>
                  </div>
                </div>

                {depLoading && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">
                    Cargando departamentos...
                  </div>
                )}

                {depError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                    No se pudieron cargar los departamentos.
                    <button
                      type="button"
                      onClick={() => refetchDepartments()}
                      className="ml-2 underline font-semibold"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                <ScopePicker
                  mode={values.roleType}
                  value={{
                    departmentId: values.scopeDepartmentId,
                    provinceId: values.scopeProvinceId,
                    municipalityId: values.scopeMunicipalityId,
                  }}
                  onChange={(next: ScopeChange) => {
                    setFieldValue("scopeDepartmentId", next.departmentId || "");
                    setFieldValue("scopeProvinceId", next.provinceId || "");
                    setFieldValue(
                      "scopeMunicipalityId",
                      next.municipalityId || "",
                    );

                    if (values.roleType === "GOVERNOR") {
                      setFieldValue("votingDepartmentId", next.departmentId || "");
                      setFieldValue("votingMunicipalityId", "");
                    } else {
                      setFieldValue(
                        "votingMunicipalityId",
                        next.municipalityId || "",
                      );
                      setFieldValue("votingDepartmentId", "");
                    }
                  }}
                />

                {values.roleType === "GOVERNOR" ? (
                  <ErrorMessage
                    name="votingDepartmentId"
                    component="div"
                    className="text-xs text-red-500 -mt-2 ml-1 font-medium"
                  />
                ) : (
                  <ErrorMessage
                    name="votingMunicipalityId"
                    component="div"
                    className="text-xs text-red-500 -mt-2 ml-1 font-medium"
                  />
                )}

                <div className="pt-4 space-y-3">
                  <LoadingButton
                    type="submit"
                    data-cy="register-submit"
                    isLoading={isSubmitting}
                    style={{ backgroundColor: "#459151" }}
                    disabled={depLoading || depError}
                    className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#459151]/20 active:scale-[0.98]"
                  >
                    {isExistingIdentityFlow ? "Solicitar acceso" : "Registrarse"}
                  </LoadingButton>

                  <Link
                    to="/resultados/login"
                    className="block text-center w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    Regresar
                  </Link>
                </div>
              </Form>
            )}
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

export default RegisterResultadosPage;
