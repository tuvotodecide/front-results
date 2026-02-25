import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import LoadingButton from "../../components/LoadingButton";
import { Link } from "react-router-dom";
import Modal2 from "../../components/Modal2";
import { useAuthLogic } from "../../hooks/useAuthLogic";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    initialValues,
    validationSchema,
    onSubmit,
    loggingIn,
    modal,
    closeModal,
  } = useAuthLogic();

  const modalType: "success" | "error" | "info" =
    modal.kind === "success"
      ? "success"
      : modal.kind === "error"
        ? "error"
        : "info";

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
        <div className="w-full max-w-[420px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 transition-all">
          <div className="flex flex-col items-center mb-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 mb-4">
              <img
                src={tuvotoDecideImage}
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
            initialValues={initialValues}
            validationSchema={validationSchema}
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#459151] transition-colors"
                  >
                    {showPassword ? (
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
                    ) : (
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
                    )}
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
                  to="/registrarse"
                  style={{ borderColor: "#459151", color: "#459151" }}
                  className="inline-block w-full py-3 border-2 font-bold rounded-xl transition-all hover:bg-[#459151]/5 active:scale-[0.98]"
                >
                  Crear cuenta
                </Link>
              </div>
              <div className="text-right -mt-2">
                <Link
                  to="/recuperar"
                  className="text-sm font-semibold text-gray-500 hover:text-[#459151]"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
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

export default Login;
