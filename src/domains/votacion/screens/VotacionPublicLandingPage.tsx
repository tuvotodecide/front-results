"use client";

import React from "react";
import BenefitsSection from "@/features/publicLanding/components/BenefitsSection";
import HowItWorksSection from "@/features/publicLanding/components/HowItWorksSection";
import { useLandingData } from "@/features/publicLanding/data/usePublicLandingRepository";
import ContactSection from "../components/ContactSection";
import HeroSection from "../components/HeroSection";
import TrustSection from "../components/TrustSection";

const VotacionPublicLandingPage: React.FC = () => {
  const { data, loading, error } = useLandingData();

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
      <HeroSection hero={data.hero} />
      <BenefitsSection benefits={data.benefits} />
      <TrustSection trust={data.trust} />
      <HowItWorksSection title={data.howItWorks.title} steps={data.howItWorks.steps} />
      <ContactSection cards={data.finalCta} contact={data.contact} />
    </div>
  );
};

export default VotacionPublicLandingPage;
