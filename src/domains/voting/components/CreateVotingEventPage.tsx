"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import ConfirmCreateModal from "@/features/elections/components/ConfirmCreateModal";
import Stepper from "@/features/elections/components/Stepper";
import { useCreateElection } from "@/features/elections/data/useElectionRepository";
import { setSelectedElection } from "@/store/election/electionSlice";
import type { ElectionFormData, ElectionFormStep1, ElectionFormStep2 } from "@/features/elections/types";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message?: string };
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
};

const getCurrentLocalDateTime = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const addMinutesToLocalDateTime = (value?: string, minutes = 1) => {
  if (!value) return getCurrentLocalDateTime();
  const base = new Date(value);
  if (Number.isNaN(base.getTime())) return getCurrentLocalDateTime();

  const next = new Date(base.getTime() + minutes * 60 * 1000);
  const timezoneOffset = next.getTimezoneOffset() * 60000;
  return new Date(next.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const step1Schema = Yup.object({
  institution: Yup.string()
    .required("Este campo es obligatorio")
    .min(3, "Mínimo 3 caracteres")
    .max(160, "Máximo 160 caracteres"),
  description: Yup.string()
    .required("Este campo es obligatorio")
    .min(10, "Mínimo 10 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
});

const step2Schema = Yup.object({
  votingStartDate: Yup.string()
    .required("Este campo es obligatorio")
    .test("not-before-now", "Debe ser una fecha y hora a partir de este momento", (value) => {
      if (!value) return true;
      return new Date(value) >= new Date();
    }),
  votingEndDate: Yup.string()
    .required("Este campo es obligatorio")
    .test("is-after-start", "Debe ser posterior a la fecha de apertura", function (value) {
      const { votingStartDate } = this.parent;
      if (!votingStartDate || !value) return true;
      return new Date(value) > new Date(votingStartDate);
    }),
  resultsDate: Yup.string()
    .required("Este campo es obligatorio")
    .test(
      "is-at-least-one-minute-after-end",
      "Debe ser al menos 1 minuto después del cierre de votación.",
      function (value) {
        const { votingEndDate } = this.parent;
        if (!votingEndDate || !value) return true;
        return new Date(value).getTime() >= new Date(votingEndDate).getTime() + 60 * 1000;
      },
    ),
});

export default function CreateVotingEventPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { createElection, creating } = useCreateElection();

  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<ElectionFormStep1>({
    institution: "",
    description: "",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<ElectionFormData | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleStep1Submit = (values: ElectionFormStep1) => {
    setSubmitError(null);
    setStep1Data(values);
    setStep(2);
  };

  const handleStep2Submit = (values: ElectionFormStep2) => {
    setSubmitError(null);
    setPendingData({
      ...step1Data,
      ...values,
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!pendingData) return;

    try {
      setSubmitError(null);
      const newElection = await createElection({
        institution: pendingData.institution,
        description: pendingData.description,
        votingStartDate: pendingData.votingStartDate,
        votingEndDate: pendingData.votingEndDate,
        resultsDate: pendingData.resultsDate,
      });

      dispatch(
        setSelectedElection({
          id: newElection.id,
          name: newElection.institution,
        }),
      );

      setShowConfirmModal(false);
      router.replace(`/elections/${newElection.id}/config/cargos`);
    } catch (error: unknown) {
      console.error("Error creando elección:", error);
      setShowConfirmModal(false);
      setSubmitError(getErrorMessage(error, "No se pudo continuar al siguiente paso. Intenta nuevamente."));
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }

    router.push("/elections");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Stepper currentStep={step} />
        </div>

        {submitError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Crear Nueva Votación
            </h1>

            <Formik
              initialValues={step1Data}
              validationSchema={step1Schema}
              onSubmit={handleStep1Submit}
            >
              {({ isValid, dirty }) => (
                <Form className="space-y-6">
                  <div>
                    <label
                      htmlFor="institution"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿A qué institución pertenece?
                    </label>
                    <Field
                      id="institution"
                      name="institution"
                      type="text"
                      placeholder="Ej: Elección Presidencial 2026"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#459151] focus:border-[#459151] transition-colors"
                    />
                    <ErrorMessage
                      name="institution"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿Cuál es el objetivo o descripción?
                    </label>
                    <Field
                      as="textarea"
                      id="description"
                      name="description"
                      rows={5}
                      placeholder="Describe el propósito de esta votación..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#459151] focus:border-[#459151] transition-colors resize-none"
                    />
                    <ErrorMessage
                      name="description"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      disabled={!isValid || !dirty}
                      className="px-12 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Definir Fechas para la elección
            </h1>

            <Formik
              initialValues={{
                votingStartDate: "",
                votingEndDate: "",
                resultsDate: "",
              }}
              validationSchema={step2Schema}
              onSubmit={handleStep2Submit}
            >
              {({ isValid, dirty, values }) => (
                <Form className="space-y-6">
                  <div>
                    <label
                      htmlFor="votingStartDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿Cuándo abre la votación?
                    </label>
                    <Field
                      id="votingStartDate"
                      name="votingStartDate"
                      type="datetime-local"
                      min={getCurrentLocalDateTime()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#459151] focus:border-[#459151] transition-colors"
                    />
                    <ErrorMessage
                      name="votingStartDate"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="votingEndDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿Cuándo cierra la votación?
                    </label>
                    <Field
                      id="votingEndDate"
                      name="votingEndDate"
                      type="datetime-local"
                      min={values.votingStartDate || getCurrentLocalDateTime()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#459151] focus:border-[#459151] transition-colors"
                    />
                    <ErrorMessage
                      name="votingEndDate"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="resultsDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿Cuándo se muestran los resultados?
                    </label>
                    <Field
                      id="resultsDate"
                      name="resultsDate"
                      type="datetime-local"
                      min={
                        values.votingEndDate
                          ? addMinutesToLocalDateTime(values.votingEndDate)
                          : values.votingStartDate || getCurrentLocalDateTime()
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#459151] focus:border-[#459151] transition-colors"
                    />
                    <ErrorMessage
                      name="resultsDate"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-12 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      type="submit"
                      disabled={!isValid || !dirty}
                      className="px-12 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CREAR
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>

      <ConfirmCreateModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        formData={pendingData}
        isLoading={creating}
      />
    </div>
  );
}
