// Tipos para el landing público

export type ElectionStatus = 'ACTIVA' | 'FINALIZADA' | 'PROXIMA';

export interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: 'padron' | 'cargos' | 'resultados';
}

export interface Step {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: 'crear' | 'cargar' | 'publicar';
}

export interface ActiveElection {
  id: string;
  title: string;
  organization: string;
  status: ElectionStatus;
  closesIn?: string; // Ej: "2h"
  votingSchedule?: {
    from: string; // Ej: "12 de febrero de 2026 - 08:00 hrs"
    to: string;   // Ej: "12 de febrero de 2026 - 18:00 hrs"
  };
  isFeatured: boolean;
}

export interface ContactInfo {
  whatsappNumber: string;
  email: string;
  attentionHours: string; // Ej: "08:30–20:00"
}

export interface PublicLandingData {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaSubtext: string;
  };
  benefits: Benefit[];
  howItWorks: {
    title: string;
    subtitle: string;
    steps: Step[];
  };
  activeElections: {
    title: string;
    featured: ActiveElection | null;
    others: ActiveElection[];
  };
  contact: ContactInfo;
}
