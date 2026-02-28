// Implementación mock del repositorio del landing público

import type { IPublicLandingRepository } from './PublicLandingRepository';
import type { PublicLandingData, ActiveElection, Benefit, Step } from '../types';

const mockBenefits: Benefit[] = [
  {
    id: '1',
    title: 'Padrón de habilitados',
    description: 'CSV + validación',
    icon: 'padron',
  },
  {
    id: '2',
    title: 'Votación por cargos',
    description: 'Estructura flexible',
    icon: 'cargos',
  },
  {
    id: '3',
    title: 'Resultados claros',
    description: 'Exporta reportes',
    icon: 'resultados',
  },
];

const mockSteps: Step[] = [
  {
    id: '1',
    number: 1,
    title: 'Crea la votación',
    description: 'Fechas, cargos y reglas',
    icon: 'crear',
  },
  {
    id: '2',
    number: 2,
    title: 'Carga padrón y candidatos',
    description: 'CSV + validación automática',
    icon: 'cargar',
  },
  {
    id: '3',
    number: 3,
    title: 'Publica resultados',
    description: 'Comparte y exporta',
    icon: 'publicar',
  },
];

const mockFeaturedElection: ActiveElection = {
  id: 'featured-1',
  title: 'Elecciones Universitarias',
  organization: 'Carrera de Informática',
  status: 'ACTIVA',
  closesIn: '2h',
  votingSchedule: {
    from: '12 de febrero de 2026 - 08:00 hrs',
    to: '12 de febrero de 2026 - 18:00 hrs',
  },
  isFeatured: true,
};

const mockOtherElections: ActiveElection[] = [
  {
    id: 'other-1',
    title: 'Elección Centro Estudiantes',
    organization: 'Facultad de Ingeniería',
    status: 'FINALIZADA',
    isFeatured: false,
  },
  {
    id: 'other-2',
    title: 'Elección Consejo Académico',
    organization: 'Universidad Pública',
    status: 'PROXIMA',
    isFeatured: false,
  },
  {
    id: 'other-3',
    title: 'Elección Sindicato Docente',
    organization: 'Colegio Nacional',
    status: 'FINALIZADA',
    isFeatured: false,
  },
];

const mockLandingData: PublicLandingData = {
  hero: {
    title: 'Organiza elecciones institucionales sin complicaciones',
    subtitle: 'Para universidades, asociaciones y organizaciones.',
    ctaText: 'Escribir por WhatsApp',
    ctaSubtext: 'Respuesta rápida',
  },
  benefits: mockBenefits,
  howItWorks: {
    title: 'Cómo funciona',
    subtitle: '3 pasos para organizar tu elección',
    steps: mockSteps,
  },
  activeElections: {
    title: 'Elecciones activas',
    featured: mockFeaturedElection,
    others: mockOtherElections,
  },
  contact: {
    whatsappNumber: '71234567',
    email: 'info@tuvotodecide.com',
    attentionHours: '08:30–20:00',
  },
};

export class PublicLandingRepositoryMock implements IPublicLandingRepository {
  async getLandingData(): Promise<PublicLandingData> {
    // Simula latencia de red
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockLandingData;
  }

  async getActiveElections(): Promise<{
    featured: ActiveElection | null;
    others: ActiveElection[];
  }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      featured: mockFeaturedElection,
      others: mockOtherElections,
    };
  }
}

// Instancia singleton para uso global
export const publicLandingRepositoryMock = new PublicLandingRepositoryMock();
