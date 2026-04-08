"use client";

import React from "react";
import type { TrustSectionData } from "@/features/publicLanding/types";
import { Link } from "../navigation/compat";

interface TrustSectionProps {
  trust: TrustSectionData;
}

const TrustSection: React.FC<TrustSectionProps> = ({ trust }) => {
  return (
    <section className="bg-[#f3fffb] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            {trust.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.1fr] gap-6 md:gap-8">
          <article className="rounded-[30px] bg-[#08b63f] px-10 py-12 text-white shadow-[0_18px_40px_rgba(8,182,63,0.18)]">
            <div className="mb-12 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="4" width="10" height="16" rx="2" />
                <path d="M9 8h2" />
                <path d="M9 12h2" />
                <path d="M9 16h2" />
                <path d="M17 7h2a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2h-3" />
              </svg>
            </div>
            <div className="text-6xl md:text-7xl font-bold tracking-tight">
              {trust.institutionsValue}
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {trust.institutionsLabel}
            </p>
          </article>

          <div className="grid grid-cols-1 gap-6 md:gap-8">
            <Link
              to="/votacion/elecciones/pasadas"
              className="block rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                      <path d="M14 2v5h5" />
                      <circle cx="10.5" cy="14.5" r="2.5" />
                      <path d="M12.5 16.5 15 19" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-5xl font-bold tracking-tight text-slate-950">
                      {trust.electionsValue}
                    </div>
                    <p className="mt-1 text-2xl text-slate-500">
                      {trust.electionsLabel}
                    </p>
                  </div>
                </div>
                <svg className="h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </Link>

            <article className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-950">
                {trust.trustedTitle}
              </h3>
              <p className="mt-2 text-lg text-slate-500">
                {trust.trustedSubtitle}
              </p>

              <div className="mt-8 grid grid-cols-4 gap-3">
                {trust.brands.map((brand) => {
                  const logoSrc =
                    typeof brand.logoSrc === "string"
                      ? brand.logoSrc
                      : brand.logoSrc?.src;

                  return (
                    <div
                      key={brand.id}
                      className="flex min-h-[84px] items-center justify-center overflow-hidden whitespace-pre-line rounded-2xl border border-slate-100 bg-slate-50 px-3 text-center text-lg font-bold shadow-[inset_0_0_0_1px_rgba(226,232,240,0.7)]"
                      style={{ color: brand.accent ?? "#1e293b" }}
                    >
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={brand.logoAlt ?? brand.name}
                          className="max-h-12 w-auto object-contain"
                        />
                      ) : (
                        brand.name
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
