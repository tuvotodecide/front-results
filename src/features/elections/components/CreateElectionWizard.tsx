// Wizard para crear nueva votación (2 pasos)
// Basado en capturas 02_step1.png y 03_step2.png

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Stepper from './Stepper';
import ConfirmCreateModal from './ConfirmCreateModal';
import { useCreateElection } from '../data/useElectionRepository';
import type { ElectionFormData, ElectionFormStep1, ElectionFormStep2 } from '../types';

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

const CalendarIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface DateTimeFieldProps {
  id: string;
  name: string;
  label: string;
  min: string;
  helper: string;
}

const DateTimeField: React.FC<DateTimeFieldProps> = ({ id, name, label, min, helper }) => (
  <div>
    <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f0_100%)] shadow-sm transition focus-within:border-[#459151] focus-within:ring-2 focus-within:ring-[#459151]/20">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-3 px-4 text-gray-500">
        <span className="rounded-full bg-white/80 p-2 shadow-sm">
          <CalendarIcon />
        </span>
        <span className="hidden text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 sm:inline">
          Fecha y hora
        </span>
      </div>
      <Field
        id={id}
        name={name}
        type="datetime-local"
        min={min}
        className="w-full bg-transparent py-4 pl-16 pr-14 text-gray-800 outline-none [color-scheme:light] sm:pl-40"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#459151]">
        <ClockIcon />
      </div>
    </div>
    <p className="mt-2 text-xs text-gray-500">{helper}</p>
    <ErrorMessage name={name} component="p" className="mt-1 text-sm text-red-600" />
  </div>
);

// Validación Step 1
const step1Schema = Yup.object({
  institution: Yup.string()
    .required('Este campo es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(160, 'Máximo 160 caracteres'),
  description: Yup.string()
    .required('Este campo es obligatorio')
    .min(10, 'Mínimo 10 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
});

// Validación Step 2
const step2Schema = Yup.object({
  votingStartDate: Yup.string()
    .required('Este campo es obligatorio')
    .test(
      'not-before-now',
      'Debe ser una fecha y hora a partir de este momento',
      (value) => {
        if (!value) return true;
        return new Date(value) >= new Date();
      }
    ),
  votingEndDate: Yup.string()
    .required('Este campo es obligatorio')
    .test(
      'is-after-start',
      'Debe ser posterior a la fecha de apertura',
      function (value) {
        const { votingStartDate } = this.parent;
        if (!votingStartDate || !value) return true;
        return new Date(value) > new Date(votingStartDate);
      }
    ),
  resultsDate: Yup.string()
    .required('Este campo es obligatorio')
    .test(
      'is-after-end',
      'Debe ser posterior al cierre de votación. No puede ser la misma hora.',
      function (value) {
        const { votingEndDate } = this.parent;
        if (!votingEndDate || !value) return true;
        return new Date(value) > new Date(votingEndDate);
      }
    ),
});

interface CreateElectionWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateElectionWizard: React.FC<CreateElectionWizardProps> = ({
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { createElection, creating } = useCreateElection();

  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<ElectionFormStep1>({
    institution: '',
    description: '',
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<ElectionFormData | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1: Info básica
  const handleStep1Submit = (values: ElectionFormStep1) => {
    setSubmitError(null);
    setStep1Data(values);
    setStep(2);
  };

  // Step 2: Fechas -> Abrir modal
  const handleStep2Submit = (values: ElectionFormStep2) => {
    setSubmitError(null);
    const fullData: ElectionFormData = {
      ...step1Data,
      ...values,
    };
    setPendingData(fullData);
    setShowConfirmModal(true);
  };

  // Confirmar creación
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

      setShowConfirmModal(false);

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/elections/${newElection.id}/config/cargos`, { replace: true });
      }
    } catch (error: any) {
      console.error('Error creando elección:', error);
      setShowConfirmModal(false);
      setSubmitError(
        error?.message || 'No se pudo continuar al siguiente paso. Intenta nuevamente.',
      );
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (onCancel) {
      onCancel();
    } else {
      navigate('/elections');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper currentStep={step} />
        </div>

        {submitError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Step 1: Info básica */}
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
                  {/* Campo Institución */}
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

                  {/* Campo Descripción */}
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

                  {/* Botón Siguiente */}
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

        {/* Step 2: Fechas */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Definir Fechas para la elección
            </h1>

            <Formik
              initialValues={{
                votingStartDate: '',
                votingEndDate: '',
                resultsDate: '',
              }}
              validationSchema={step2Schema}
              onSubmit={handleStep2Submit}
            >
              {({ isValid, dirty, values }) => (
                <Form className="space-y-6">
                  {/* Fecha apertura */}
                  <DateTimeField
                    id="votingStartDate"
                    name="votingStartDate"
                    label="¿Cuándo abre la votación?"
                    min={getCurrentLocalDateTime()}
                    helper="Selecciona el inicio oficial de la votación."
                  />

                  {/* Fecha cierre */}
                  <DateTimeField
                    id="votingEndDate"
                    name="votingEndDate"
                    label="¿Cuándo cierra la votación?"
                    min={values.votingStartDate || getCurrentLocalDateTime()}
                    helper="Debe ser posterior a la apertura."
                  />

                  {/* Fecha resultados */}
                  <DateTimeField
                      id="resultsDate"
                      name="resultsDate"
                      label="¿Cuándo se muestran los resultados?"
                      min={
                        values.votingEndDate
                          ? addMinutesToLocalDateTime(values.votingEndDate)
                          : values.votingStartDate || getCurrentLocalDateTime()
                      }
                      helper="Debe publicarse después del cierre, no en la misma hora."
                    />

                  {/* Botones */}
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

      {/* Modal de confirmación */}
      <ConfirmCreateModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        formData={pendingData}
        isLoading={creating}
      />
    </div>
  );
};

export default CreateElectionWizard;
