"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  type FormikHelpers,
  useFormikContext,
} from "formik";
import * as Yup from "yup";
import LoadingButton from "@/components/LoadingButton";
import Modal2 from "@/components/Modal2";
import ScopePicker from "@/components/ScopePicker";
import { isVotingMode } from "@/config/appMode";
import AuthCardLayout from "@/domains/auth/components/AuthCardLayout";
import { writePendingContext } from "@/shared/auth/storage";
import type { ModalState } from "@/types/modalview";
import {
  useCreateInstitutionalAdminApplicationMutation,
  useCreateUserMutation,
} from "@/store/auth/authEndpoints";
import { useGetDepartmentsQuery } from "@/store/departments/departmentsEndpoints";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { data?: { message?: string | string[] }; message?: string };
    const message = candidate.data?.message ?? candidate.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join("\n");
  }

  return fallback;
};

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

interface VotingFormValues {
  dni: string;
  name: string;
  email: string;
  tenantName: string;
  password: string;
  confirmPassword: string;
}

const votingValidationSchema = Yup.object({
  dni: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9-]{5,20}$/, "Carnet inválido")
    .required("El carnet es obligatorio"),
  name: Yup.string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(120, "Máximo 120 caracteres")
    .required("El nombre completo es obligatorio"),
  email: Yup.string()
    .trim()
    .email("Correo electrónico inválido")
    .required("El correo es obligatorio"),
  tenantName: Yup.string()
    .trim()
    .required("El nombre de la institución es obligatorio")
    .min(3, "Mínimo 3 caracteres")
    .max(160, "Máximo 160 caracteres"),
  password: Yup.string()
    .trim()
    .min(8, "Mínimo 8 caracteres")
    .required("La contraseña es obligatoria"),
  confirmPassword: Yup.string()
    .trim()
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
    .required("Debes confirmar tu contraseña"),
});

const resultsValidationSchema = Yup.object({
  dni: Yup.string().trim().required("El carnet es obligatorio"),
  name: Yup.string().trim().required("El nombre completo es obligatorio"),
  email: Yup.string()
    .trim()
    .email("Correo electrónico inválido")
    .required("El correo es obligatorio"),
  password: Yup.string()
    .trim()
    .min(8, "Mínimo 8 caracteres")
    .required("La contraseña es obligatoria"),
  confirmPassword: Yup.string()
    .trim()
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
    .required("Debes confirmar tu contraseña"),
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

function RoleTypeWatcher() {
  const { values, setFieldValue } = useFormikContext<ResultsFormValues>();

  useEffect(() => {
    setFieldValue("votingDepartmentId", "");
    setFieldValue("votingMunicipalityId", "");
    setFieldValue("scopeDepartmentId", "");
    setFieldValue("scopeProvinceId", "");
    setFieldValue("scopeMunicipalityId", "");
  }, [setFieldValue, values.roleType]);

  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [createUser] = useCreateUserMutation();
  const [createInstitutionalAdminApplication] =
    useCreateInstitutionalAdminApplicationMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    isLoading: depLoading,
    isError: depError,
    refetch: refetchDepartments,
  } = useGetDepartmentsQuery({}, { skip: isVotingMode() });

  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: "",
    message: "",
    kind: "info",
  });

  const closeModal = () => setModal((current) => ({ ...current, open: false }));
  const openModal = (payload: Omit<ModalState, "open">) =>
    setModal({ open: true, ...payload });

  const registerVotingUser = async (
    values: VotingFormValues,
    helpers: FormikHelpers<VotingFormValues>,
  ) => {
    setIsSubmitting(true);

    const payload = {
      dni: values.dni,
      name: values.name,
      email: values.email,
      password: values.password,
      institutionName: values.tenantName,
    };

    try {
      await createInstitutionalAdminApplication(payload).unwrap();
      writePendingContext({ email: payload.email, reason: "VERIFY_EMAIL" });
      router.replace("/pendiente");
    } catch (error: unknown) {
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

  const registerResultsUser = async (
    values: ResultsFormValues,
    helpers: FormikHelpers<ResultsFormValues>,
  ) => {
    setIsSubmitting(true);
    const { roleType, ...rest } = values;

    const payload: Record<string, string> = {
      dni: rest.dni,
      name: rest.name,
      email: rest.email,
      password: rest.password,
      ...(roleType === "GOVERNOR"
        ? { votingDepartmentId: rest.votingDepartmentId }
        : { votingMunicipalityId: rest.votingMunicipalityId }),
    };

    try {
      await createUser(payload).unwrap();
      writePendingContext({ email: payload.email, reason: "VERIFY_EMAIL" });
      router.replace("/pendiente");
    } catch (error: unknown) {
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
      <AuthCardLayout
        title="Registrarse"
        subtitle={
          isVotingMode()
            ? "Crea tu cuenta y administra votaciones"
            : "Crea tu cuenta en Tu voto decide"
        }
      >
        {isVotingMode() ? (
          <Formik<VotingFormValues>
            initialValues={{
              dni: "",
              name: "",
              email: "",
              tenantName: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={votingValidationSchema}
            onSubmit={registerVotingUser}
          >
            <Form className="space-y-5" autoComplete="off">
              <VotingCommonFields />
              <div className="flex flex-col">
                <label className="mb-1 ml-1 text-sm font-semibold text-gray-700">
                  Nombre de la institución o empresa
                </label>
                <Field
                  name="tenantName"
                  data-cy="register-tenant-name"
                  placeholder="Ej: Universidad Nacional, Empresa ABC"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
                />
                <ErrorMessage
                  name="tenantName"
                  component="div"
                  className="ml-1 mt-1 text-xs font-medium text-red-500"
                />
                <p className="ml-1 mt-1 text-xs text-gray-500">
                  Recibirás un correo para verificar tu solicitud. Luego quedará pendiente de aprobación.
                </p>
              </div>
              <PasswordFields showPassword={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              <FormActions isSubmitting={isSubmitting} disabled={false} />
            </Form>
          </Formik>
        ) : (
          <Formik<ResultsFormValues>
            initialValues={{
              dni: "",
              name: "",
              password: "",
              confirmPassword: "",
              email: "",
              roleType: "MAYOR",
              votingDepartmentId: "",
              votingMunicipalityId: "",
              scopeDepartmentId: "",
              scopeProvinceId: "",
              scopeMunicipalityId: "",
            }}
            validationSchema={resultsValidationSchema}
            onSubmit={registerResultsUser}
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-5" autoComplete="off">
                <RoleTypeWatcher />
                <StandardCommonFields />

                <div className="flex flex-col">
                  <label className="mb-2 ml-1 text-sm font-semibold text-gray-700">Tipo de cuenta</label>
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
                      className={`rounded-xl border py-3 font-semibold transition ${
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
                      className={`rounded-xl border py-3 font-semibold transition ${
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
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    Cargando departamentos...
                  </div>
                )}

                {depError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    No se pudieron cargar los departamentos.
                    <button
                      type="button"
                      onClick={() => refetchDepartments()}
                      className="ml-2 font-semibold underline"
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
                  onChange={(next) => {
                    setFieldValue("scopeDepartmentId", next.departmentId || "");
                    setFieldValue("scopeProvinceId", next.provinceId || "");
                    setFieldValue("scopeMunicipalityId", next.municipalityId || "");

                    if (values.roleType === "GOVERNOR") {
                      setFieldValue("votingDepartmentId", next.departmentId || "");
                      setFieldValue("votingMunicipalityId", "");
                    } else {
                      setFieldValue("votingMunicipalityId", next.municipalityId || "");
                      setFieldValue("votingDepartmentId", "");
                    }
                  }}
                />

                {values.roleType === "GOVERNOR" ? (
                  <ErrorMessage
                    name="votingDepartmentId"
                    component="div"
                    className="-mt-2 ml-1 text-xs font-medium text-red-500"
                  />
                ) : (
                  <ErrorMessage
                    name="votingMunicipalityId"
                    component="div"
                    className="-mt-2 ml-1 text-xs font-medium text-red-500"
                  />
                )}

                <PasswordFields showPassword={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                <FormActions isSubmitting={isSubmitting} disabled={depLoading || depError} />
              </Form>
            )}
          </Formik>
        )}
      </AuthCardLayout>

      <Modal2
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.title}
        size="sm"
        type={modal.kind === "error" ? "error" : modal.kind === "success" ? "success" : "info"}
      >
        <div className="space-y-4">
          <p className="whitespace-pre-line text-sm text-gray-700">{modal.message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
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

function StandardCommonFields() {
  return (
    <>
      <BasicField name="dni" label="Carnet" dataCy="register-dni" />
      <BasicField name="name" label="Nombre completo" dataCy="register-name" />
      <BasicField name="email" label="Correo" dataCy="register-email" type="email" />
    </>
  );
}

function VotingCommonFields() {
  return (
    <>
      <BasicField name="dni" label="Carnet" dataCy="register-dni" />
      <BasicField name="name" label="Nombre completo" dataCy="register-name" />
      <BasicField name="email" label="Correo" dataCy="register-email" type="email" />
    </>
  );
}

function BasicField({
  name,
  label,
  dataCy,
  type,
}: {
  name: string;
  label: string;
  dataCy: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 ml-1 text-sm font-semibold text-gray-700">{label}</label>
      <Field
        name={name}
        type={type}
        data-cy={dataCy}
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
      />
      <ErrorMessage
        name={name}
        component="div"
        className="ml-1 mt-1 text-xs font-medium text-red-500"
      />
    </div>
  );
}

function PasswordFields({
  showPassword,
  onToggle,
}: {
  showPassword: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <div className="flex flex-col">
        <label className="mb-1 ml-1 text-sm font-semibold text-gray-700">Contraseña</label>
        <div className="relative">
          <Field
            name="password"
            data-cy="register-password"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-11 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
          />
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#459151]"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <ErrorMessage
          name="password"
          component="div"
          className="ml-1 mt-1 text-xs font-medium text-red-500"
        />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 ml-1 text-sm font-semibold text-gray-700">
          {isVotingMode() ? "Confirmar contraseña" : "Repetir contraseña"}
        </label>
        <div className="relative">
          <Field
            name="confirmPassword"
            data-cy="register-confirm-password"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-11 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]"
          />
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#459151]"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <ErrorMessage
          name="confirmPassword"
          component="div"
          className="ml-1 mt-1 text-xs font-medium text-red-500"
        />
      </div>
    </>
  );
}

function FormActions({
  isSubmitting,
  disabled,
}: {
  isSubmitting: boolean;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3 pt-4">
      <LoadingButton
        type="submit"
        data-cy="register-submit"
        isLoading={isSubmitting}
        style={{ backgroundColor: "#459151" }}
        disabled={disabled}
        className="w-full rounded-xl py-3 font-bold text-white shadow-lg shadow-[#459151]/20 transition-all active:scale-[0.98]"
      >
        Registrarse
      </LoadingButton>

      <Link
        href="/login"
        className="block w-full rounded-xl border-2 border-gray-200 py-3 text-center font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
      >
        Regresar
      </Link>
    </div>
  );
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.486A3 3 0 0013.5 13.5m-9.463-1.178a10.477 10.477 0 011.934-3.546m3.094-2.665A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L9.88 9.88" />
  </svg>
);
