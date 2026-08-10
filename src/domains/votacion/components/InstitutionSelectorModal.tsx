"use client";

import { useEffect, useRef } from "react";
import Modal from "@/components/Modal";
import type { AuthContext } from "@/store/auth/authSlice";
import { getInstitutionDisplayName } from "@/store/auth/contextUtils";

interface InstitutionSelectorModalProps {
  isOpen: boolean;
  institutions: AuthContext[];
  onSelect: (context: AuthContext) => void;
}

export default function InstitutionSelectorModal({
  isOpen,
  institutions,
  onSelect,
}: InstitutionSelectorModalProps) {
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusFirstOption = window.setTimeout(() => {
      firstOptionRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusFirstOption);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      title="Selecciona una institución"
      showClose={false}
      closeOnBackdrop={false}
      size="md"
    >
      <p className="mb-5 text-sm text-slate-600">
        Elige la institución que deseas administrar.
      </p>
      <div className="space-y-2" role="list" aria-label="Instituciones disponibles">
        {institutions.map((institution, index) => {
          const name = getInstitutionDisplayName(institution);

          return (
            <div
              key={`${institution.type}-${institution.tenantId ?? ""}-${institution.membershipId ?? ""}`}
              role="listitem"
            >
              <button
                ref={index === 0 ? firstOptionRef : undefined}
                type="button"
                onClick={() => onSelect(institution)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-[#459151] hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-[#459151] focus:ring-offset-2"
                aria-label={`Administrar ${name}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{name}</span>
                </span>
                <span aria-hidden="true" className="shrink-0 text-lg text-[#2f6f3a]">›</span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
