"use client";

import React from "react";
import type { LandingHero } from "@/features/publicLanding/types";
import { Link } from "../navigation/compat";

interface HeroSectionProps {
  hero: LandingHero;
}

const HeroSection: React.FC<HeroSectionProps> = ({ hero }) => {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.18),_transparent_48%),linear-gradient(180deg,_#f3fff7_0%,_#f8fafc_100%)] py-10 md:py-12">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.92] tracking-tight text-slate-950">
          <span>{hero.title.prefix}</span>{" "}
          <span className="text-emerald-500">{hero.title.highlight}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-4xl text-xl md:text-[1.75rem] leading-relaxed text-slate-600">
          {hero.subtitle}
        </p>

        <div className="mx-auto mt-6 flex justify-center">
          <div
            className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] md:max-w-4xl md:aspect-[16/9]"
            style={{ maxHeight: "clamp(340px, 58vh, 560px)" }}
          >
            <iframe
              src={hero.videoEmbedUrl}
              title="Video Tu Voto Decide"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/votacion/registrarse"
            className="inline-flex min-w-[220px] items-center justify-center rounded-[18px] bg-emerald-500 px-8 py-4 text-xl sm:text-2xl font-bold text-white shadow-[0_12px_30px_rgba(34,197,94,0.32)] transition hover:bg-emerald-600"
          >
            {hero.ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
