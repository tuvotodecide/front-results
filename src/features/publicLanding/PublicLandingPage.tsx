"use client";

// Página principal del Landing Público
// Compone las 4 secciones: Hero, Cómo funciona, Elecciones activas, Contacto

import React from 'react';
import { useLandingData } from './data/usePublicLandingRepository';
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import ActiveElectionsSection from './components/ActiveElectionsSection';
import ContactSection from './components/ContactSection';
const LandingErrorNotice: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <section className="bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">No se pudo cargar la información en tiempo real</h2>
              <p className="mt-1 text-sm text-slate-600">
                La página sigue disponible, pero las elecciones activas no pudieron actualizarse desde el backend.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  </section>
);

const ActiveElectionsUnavailable: React.FC<{ title: string; onRetry: () => void }> = ({
  title,
  onRetry,
}) => (
  <section className="bg-slate-50 py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center md:mb-16">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">{title}</h2>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4m0 4h.01" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900">Elecciones no disponibles temporalmente</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
          No pudimos consultar las elecciones públicas en este momento. Puedes intentar nuevamente en unos segundos.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Volver a intentar
        </button>
      </div>
    </div>
  </section>
);

const PublicLandingPage: React.FC = () => {
  const { data, loading, error, refetch } = useLandingData();
  const hasActiveElections = Boolean(
    data?.activeElections?.featured || (data?.activeElections?.others?.length ?? 0) > 0,
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#459151] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    if (!data) {
      return (
        <div className="min-h-screen bg-slate-50">
          <LandingErrorNotice onRetry={refetch} />
        </div>
      );
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <LandingErrorNotice onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {error && <LandingErrorNotice onRetry={refetch} />}

      {/* Sección 1: Hero */}
      <HeroSection
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        ctaText={data.hero.ctaText}
        ctaSubtext={data.hero.ctaSubtext}
        benefits={data.benefits}
        whatsappNumber={data.contact.whatsappNumber}
      />

      {/* Sección 2: Cómo funciona */}
      <HowItWorksSection
        title={data.howItWorks.title}
        subtitle={data.howItWorks.subtitle}
        steps={data.howItWorks.steps}
      />

      {/* Sección 3: Elecciones activas */}
      {hasActiveElections ? (
        <ActiveElectionsSection
          title={data.activeElections.title}
          featured={data.activeElections.featured}
          others={data.activeElections.others}
        />
      ) : error ? (
        <ActiveElectionsUnavailable
          title={data.activeElections.title}
          onRetry={refetch}
        />
      ) : null}

      {/* Sección 4: Contacto */}
      <ContactSection contact={data.contact} />

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Tu Voto Decide. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
