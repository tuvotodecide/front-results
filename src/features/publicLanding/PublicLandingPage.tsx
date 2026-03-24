// Página principal del Landing Público
// Compone las 4 secciones: Hero, Cómo funciona, Elecciones activas, Contacto

import React from 'react';
import { useLandingData } from './data/usePublicLandingRepository';
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import ActiveElectionsSection from './components/ActiveElectionsSection';
import ContactSection from './components/ContactSection';

const PublicLandingPage: React.FC = () => {
  const { data, loading, error } = useLandingData();
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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar
          </h2>
          <p className="text-gray-600">
            No se pudo cargar la información. Por favor, intenta de nuevo más tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
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
      {hasActiveElections && (
        <ActiveElectionsSection
          title={data.activeElections.title}
          featured={data.activeElections.featured}
          others={data.activeElections.others}
        />
      )}

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
