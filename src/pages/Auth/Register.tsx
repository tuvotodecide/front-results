// C:\apps\front-results\src\pages\Auth\Register.tsx
import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useCreateUserMutation } from "../../store/auth/authEndpoints";
import { useNavigate, Link } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import ScopePicker from "../../components/ScopePicker";

import { useFormikContext } from "formik";
import Modal2 from "../../components/Modal2";
import { useGetDepartmentsQuery } from "../../store/departments/departmentsEndpoints";
import { ModalState } from "../../types";

interface FormValues {
  dni: string;
  name: string;
  password: string;
  confirmPassword: string;
  email: string;

  roleType: "MAYOR" | "GOVERNOR";

  // payload backend (uno u otro)
  votingDepartmentId: string;
  votingMunicipalityId: string;

  // UI-only (para navegar niveles cuando es MAYOR)
  scopeDepartmentId: string;
  scopeProvinceId: string;
  scopeMunicipalityId: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [createUser] = useCreateUserMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    isLoading: depLoading,
    isError: depError,
    refetch: refetchDepartments,
  } = useGetDepartmentsQuery({});
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

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const openModal = (payload: Omit<ModalState, "open">) =>
    setModal({ open: true, ...payload });
  function RoleTypeWatcher() {
    const { values, setFieldValue } = useFormikContext<FormValues>();

    useEffect(() => {
      setFieldValue("votingDepartmentId", "");
      setFieldValue("votingMunicipalityId", "");
      setFieldValue("scopeDepartmentId", "");
      setFieldValue("scopeProvinceId", "");
      setFieldValue("scopeMunicipalityId", "");
    }, [values.roleType, setFieldValue]);

    return null;
  }

  const validationSchema = Yup.object({
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
      then: (s) => s.required("Debes seleccionar un departamento"),
      otherwise: (s) => s.notRequired(),
    }),

    votingMunicipalityId: Yup.string().when("roleType", {
      is: "MAYOR",
      then: (s) => s.required("Debes seleccionar un municipio"),
      otherwise: (s) => s.notRequired(),
    }),
  });

  const registerUser = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>,
  ) => {
    setIsSubmitting(true);

    const { confirmPassword, roleType, ...rest } = values;

    // Construcción de payload (solo uno de los dos)
    const payload: any = {
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
      localStorage.setItem("pendingEmail", payload.email);
      localStorage.setItem("pendingReason", "VERIFY_EMAIL");
      navigate("/pendiente", { replace: true });
    } catch (error: any) {
      const msg = error?.data?.message;
      let displayMessage = "No se pudo registrar";

      // Manejo de errores si vienen como array o string
      if (Array.isArray(msg)) {
        displayMessage = msg.join("\n");
      } else if (typeof msg === "string") {
        displayMessage = msg;
      }

      openModal({
        kind: "error",
        title: "Hubo un problema",
        message: displayMessage,
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

          <Formik<FormValues>
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
            validationSchema={validationSchema}
            onSubmit={registerUser}
          >
            {({ values, setFieldValue }) => {
              return (
                <Form className="space-y-5">
                  <RoleTypeWatcher />
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

                  {/* Tipo de cuenta */}
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2 ml-1">
                      Tipo de cuenta
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFieldValue("roleType", "MAYOR");
                          // limpiar selección para evitar inconsistencias
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
                          // limpiar selección para evitar inconsistencias
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
                  {/* Alcance territorial */}
                  <ScopePicker
                    mode={values.roleType}
                    value={{
                      departmentId: values.scopeDepartmentId,
                      provinceId: values.scopeProvinceId,
                      municipalityId: values.scopeMunicipalityId,
                    }}
                    onChange={(next: any) => {
                      // UI navigation values
                      setFieldValue(
                        "scopeDepartmentId",
                        next.departmentId || "",
                      );
                      setFieldValue("scopeProvinceId", next.provinceId || "");
                      setFieldValue(
                        "scopeMunicipalityId",
                        next.municipalityId || "",
                      );

                      // backend values
                      if (values.roleType === "GOVERNOR") {
                        setFieldValue(
                          "votingDepartmentId",
                          next.departmentId || "",
                        );
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

                  {/* Error específico debajo del picker */}
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
              );
            }}
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

export default Register;
