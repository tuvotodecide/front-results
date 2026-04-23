// Wizard para crear nueva votación (2 pasos)
// Basado en capturas 02_step1.png y 03_step2.png

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@/domains/votacion/navigation/compat-private';
import { Formik, Form, Field, ErrorMessage, type FieldProps } from 'formik';
import * as Yup from 'yup';
import Stepper from './Stepper';
import ConfirmCreateModal from './ConfirmCreateModal';
import { useCreateElection } from '../data/useElectionRepository';
import {
  addMinutesToLocalDateTime,
  getCurrentLocalDateTime,
  getMinimumLocalDateTime,
  MIN_CREATE_LEAD_HOURS,
  MIN_CREATE_LEAD_MS,
} from '../../electionConfig/renderUtils';
import type { ElectionFormData, ElectionFormStep1, ElectionFormStep2 } from '../types';

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
  isReferendum: Yup.boolean().required(),
});

// Validación Step 2
const step2Schema = Yup.object({
  votingStartDate: Yup.string()
    .required('Este campo es obligatorio')
    .test(
      'minimum-12-hours',
      `Debe programarse con al menos ${MIN_CREATE_LEAD_HOURS} horas de anticipación.`,
      (value) => {
        if (!value) return true;
        return new Date(value).getTime() >= Date.now() + MIN_CREATE_LEAD_MS;
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
      'is-at-least-one-minute-after-end',
      'Debe ser al menos 1 minuto después del cierre de votación.',
      function (value) {
        const { votingEndDate } = this.parent;
        if (!votingEndDate || !value) return true;
        return new Date(value).getTime() >= new Date(votingEndDate).getTime() + 60 * 1000;
      }
    ),
});

const CalendarIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4M3 10h18" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);

interface DateTimeFieldProps {
  id: string;
  name: keyof ElectionFormStep2;
  min?: string;
  hint?: string;
}

const DateTimeField: React.FC<DateTimeFieldProps> = ({ id, name, min, hint }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    input?.focus();
    input?.showPicker?.();
  };

  return (
    <Field name={name}>
      {({ field }: FieldProps<string>) => (
        <>
          <div className="group relative">
            <input
              {...field}
              ref={inputRef}
              id={id}
              type="datetime-local"
              min={min}
              onClick={openPicker}
              className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white py-3 pl-4 pr-20 text-gray-800 shadow-sm outline-none transition-all [color-scheme:light] [appearance:textfield] hover:border-[#459151] focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
            <button
              type="button"
              onClick={openPicker}
              aria-label="Abrir selector de fecha y hora"
              className="absolute inset-y-0 right-0 flex w-16 items-center justify-center rounded-r-xl border-l border-[#459151]/25 bg-[#EFF7F0] text-[#2E6A38] transition-colors group-hover:bg-[#E1F0E4] group-focus-within:bg-[#D7EBDC] group-focus-within:text-[#24582D]"
            >
              <CalendarIcon />
            </button>
          </div>
          {hint ? (
            <p className="mt-1 text-xs text-gray-500">
              {hint}
            </p>
          ) : null}
        </>
      )}
    </Field>
  );
};

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
    isReferendum: false,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<ElectionFormData | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentLocalDateTime, setCurrentLocalDateTime] = useState('');
  const [minimumVotingStartDateTime, setMinimumVotingStartDateTime] = useState('');

  useEffect(() => {
    const refreshMinimumDateTime = () => {
      setCurrentLocalDateTime(getCurrentLocalDateTime());
      setMinimumVotingStartDateTime(getMinimumLocalDateTime(MIN_CREATE_LEAD_MS));
    };

    refreshMinimumDateTime();

    const intervalId = window.setInterval(refreshMinimumDateTime, 60 * 1000);
    window.addEventListener('focus', refreshMinimumDateTime);
    document.addEventListener('visibilitychange', refreshMinimumDateTime);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshMinimumDateTime);
      document.removeEventListener('visibilitychange', refreshMinimumDateTime);
    };
  }, []);

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
        isReferendum: pendingData.isReferendum,
        votingStartDate: pendingData.votingStartDate,
        votingEndDate: pendingData.votingEndDate,
        resultsDate: pendingData.resultsDate,
      });

      setShowConfirmModal(false);

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/votacion/elecciones/${newElection.id}/config/cargos`, { replace: true });
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
      navigate('/votacion/elecciones');
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
              validateOnMount
              onSubmit={handleStep1Submit}
            >
              {({ isValid }) => (
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

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">¿Es referéndum?</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Actívalo si esta votación será una consulta con opciones de respuesta.
                        </p>
                      </div>
                      <Field name="isReferendum">
                        {({ field, form }: FieldProps<boolean>) => (
                          <button
                            type="button"
                            role="switch"
                            aria-label="¿Es referéndum?"
                            aria-checked={field.value}
                            onClick={() => {
                              void form.setFieldValue('isReferendum', !field.value, true);
                              void form.setFieldTouched('isReferendum', true, false);
                            }}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                              field.value ? 'bg-[#459151]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                field.value ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                      </Field>
                    </div>

                    <Field name="isReferendum">
                      {({ field }: FieldProps<boolean>) =>
                        field.value ? (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            Si eliges referéndum, después no podrás cambiar este tipo de votación.
                            La papeleta se mostrará como una consulta con opciones de respuesta.
                          </div>
                        ) : null
                      }
                    </Field>
                  </div>

                  {/* Botón Siguiente */}
                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      disabled={!isValid}
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
              Definir fechas para la elección
            </h1>

            <Formik
              initialValues={{
                votingStartDate: '',
                votingEndDate: '',
                resultsDate: '',
              }}
              validationSchema={step2Schema}
              validateOnMount
              onSubmit={handleStep2Submit}
            >
              {({ isValid, values }) => (
                <Form className="space-y-6">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    La elección debe crearse con al menos {MIN_CREATE_LEAD_HOURS} horas de anticipación respecto a la hora actual.
                  </div>

                  {/* Fecha apertura */}
                  <div>
                    <label
                      htmlFor="votingStartDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿Cuándo abre la votación?
                    </label>
                    <DateTimeField
                      id="votingStartDate"
                      name="votingStartDate"
                      min={minimumVotingStartDateTime}
                    />

                    <ErrorMessage
                      name="votingStartDate"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />

                  </div>

                  {/* Fecha cierre */}
                  <div>
                    <label
                      htmlFor="votingEndDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿Cuándo cierra la votación?
                    </label>
                    <DateTimeField
                      id="votingEndDate"
                      name="votingEndDate"
                      min={values.votingStartDate || minimumVotingStartDateTime || currentLocalDateTime}
                      hint="Debe ser posterior a la fecha y hora de inicio."
                    />

                    <ErrorMessage
                      name="votingEndDate"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  {/* Fecha resultados */}
                  <div>
                    <label
                      htmlFor="resultsDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ¿Cuándo se muestran los resultados?
                    </label>
                    <DateTimeField
                      id="resultsDate"
                      name="resultsDate"
                      min={
                        values.votingEndDate
                          ? addMinutesToLocalDateTime(values.votingEndDate, 1, currentLocalDateTime)
                          : values.votingStartDate || currentLocalDateTime
                      }
                      hint="Debe ser al menos 1 minuto posterior al cierre."
                    />

                    <ErrorMessage
                      name="resultsDate"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

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
                      disabled={!isValid}
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
