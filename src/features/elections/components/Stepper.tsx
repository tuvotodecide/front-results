// Componente Stepper para wizard de 2 pasos
// Basado en capturas 02 y 03

import React from 'react';

interface StepperProps {
  currentStep: 1 | 2;
  totalSteps?: number;
}

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center gap-0">
      {/* Step 1 */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors ${
          currentStep >= 1
            ? 'bg-[#459151] text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        1
      </div>

      {/* Línea conectora */}
      <div
        className={`w-20 h-0.5 ${
          currentStep >= 2 ? 'bg-[#459151]' : 'bg-gray-300'
        }`}
      />

      {/* Step 2 */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors ${
          currentStep >= 2
            ? 'bg-[#459151] text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        2
      </div>
    </div>
  );
};

export default Stepper;
