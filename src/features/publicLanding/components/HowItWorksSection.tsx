import React from 'react';
import type { Step } from '../types';

const StepIcon: React.FC<{ type: Step['icon'] }> = ({ type }) => {
  const className = 'w-8 h-8';

  const icons = {
    'user-plus': (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </svg>
    ),
    settings: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.91 4.6H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.45.27.73.75.73 1.28V10a2 2 0 1 1 0 4v.09c0 .53-.28 1.01-.73 1.28z" />
      </svg>
    ),
    users: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    pulse: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 7-4-14-3 7H2" />
      </svg>
    ),
    mobile: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18h2" />
      </svg>
    ),
  };

  return icons[type];
};

interface HowItWorksSectionProps {
  title: string;
  steps: Step[];
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ title, steps }) => {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-[10%] right-[10%] top-12 hidden lg:block border-t-2 border-emerald-200" />
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-6">
            {steps.map((step) => (
              <article key={step.id} className="relative text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-100 bg-white text-emerald-600 shadow-[0_12px_24px_rgba(34,197,94,0.12)]">
                  <StepIcon type={step.icon} />
                </div>
                <div className="absolute left-1/2 top-0 ml-8 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white shadow-[0_10px_20px_rgba(34,197,94,0.3)]">
                  {step.number}
                </div>
                <h3 className="mt-8 text-2xl font-bold leading-tight text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
