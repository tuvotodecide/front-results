// Tabs de pasos para configuración de elección
// Flujo normal: 1. Cargos | 2. Planchas | 3. Padrón
// Referéndum: 1. Opciones | 2. Padrón
// Soporta estados: pending, active, completed

import React from 'react';
import type { ConfigStep, StepStatus } from '../types';

interface ConfigStepsTabsProps {
  currentStep: ConfigStep;
  completedSteps?: ConfigStep[];
  onStepChange?: (step: ConfigStep) => void;
  canNavigate?: (step: ConfigStep) => boolean;
  isReferendum?: boolean;
}

const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ConfigStepsTabs: React.FC<ConfigStepsTabsProps> = ({
  currentStep,
  completedSteps = [],
  onStepChange,
  canNavigate = () => true,
  isReferendum = false,
}) => {
  const steps: { step: ConfigStep; label: string }[] = isReferendum
    ? [
        { step: 2, label: '1. Opciones' },
        { step: 3, label: '2. Padrón' },
      ]
    : [
        { step: 1, label: '1. Cargos' },
        { step: 2, label: '2. Planchas' },
        { step: 3, label: '3. Padrón' },
      ];

  const getStepStatus = (step: ConfigStep): StepStatus => {
    if (currentStep === step) return 'active';
    if (completedSteps.includes(step)) return 'completed';
    return 'pending';
  };

  const handleClick = (step: ConfigStep) => {
    if (onStepChange && canNavigate(step)) {
      onStepChange(step);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map(({ step, label }) => {
        const status = getStepStatus(step);
        const isClickable = canNavigate(step);

        return (
          <button
            key={step}
            type="button"
            onClick={() => handleClick(step)}
            disabled={!isClickable}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all
              ${status === 'active' && 'bg-[#459151] text-white shadow-md'}
              ${status === 'completed' && 'bg-green-100 text-green-800 border border-green-200'}
              ${status === 'pending' && 'bg-gray-100 text-gray-500'}
              ${!isClickable ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
            `}
          >
            <span
              aria-hidden="true"
              className={`inline-flex min-h-4 min-w-4 items-center justify-center ${
                status === 'completed' ? 'text-[#459151]' : 'invisible'
              }`}
            >
              {status === 'completed' ? (
                <CheckIcon />
              ) : (
                <span className="h-4 w-4" />
              )}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ConfigStepsTabs;
