import React, { useMemo, useState } from 'react';
import type { BenefitCard, BenefitsSectionData } from '../types';

const BenefitIcon: React.FC<{ type: BenefitCard['icon'] }> = ({ type }) => {
  const className = 'w-8 h-8';

  const icons = {
    desktop: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="11" rx="2" />
        <path d="M8 19h8" />
        <path d="M12 16v3" />
      </svg>
    ),
    users: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 4.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    'file-search': (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
        <circle cx="10.5" cy="14.5" r="2.5" />
        <path d="M12.5 16.5 15 19" />
      </svg>
    ),
    shield: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
        <path d="m9.5 12 1.5 1.5 3-3" />
      </svg>
    ),
    id: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="12" r="2.2" />
        <path d="M14 10h4" />
        <path d="M14 14h4" />
      </svg>
    ),
    check: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m8 12 2.5 2.5L16 9" />
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

interface BenefitsSectionProps {
  benefits: BenefitsSectionData;
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ benefits }) => {
  const [activeAudience, setActiveAudience] = useState(benefits.audiences[0]?.id ?? 'organizers');

  const activeCards = useMemo(
    () => benefits.audiences.find((audience) => audience.id === activeAudience)?.cards ?? [],
    [activeAudience, benefits.audiences],
  );

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            {benefits.title}
          </h2>
        </div>

        <div className="flex justify-center mb-10 md:mb-14">
          <div className="inline-flex rounded-full bg-slate-100 p-1 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
            {benefits.audiences.map((audience) => {
              const isActive = audience.id === activeAudience;
              return (
                <button
                  key={audience.id}
                  type="button"
                  onClick={() => setActiveAudience(audience.id)}
                  className={[
                    'min-w-[150px] rounded-full px-5 py-3 text-sm md:text-base font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-white text-emerald-600 shadow-[0_2px_10px_rgba(15,23,42,0.12)] ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {audience.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
          {activeCards.map((card) => (
            <article
              key={card.id}
              className="rounded-[28px] border border-slate-200 bg-slate-50 px-8 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BenefitIcon type={card.icon} />
              </div>
              <h3 className="mb-4 text-2xl font-bold leading-tight text-slate-950">
                {card.title}
              </h3>
              <p className="text-lg leading-8 text-slate-600">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
