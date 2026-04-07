import asoLogo from '../../../assets/aso.webp';
import bisaLogo from '../../../assets/bisa.webp';
import boaLogo from '../../../assets/boa.webp';
import caincoLogo from '../../../assets/cainco.webp';
import pilLogo from '../../../assets/pil.webp';
import tigreLogo from '../../../assets/tigre.webp';
import ypfbLogo from '../../../assets/ypfb.webp';
import type { IPublicLandingRepository } from './PublicLandingRepository';
import type { ActiveElection, PublicLandingData } from '../types';

const mockPastElections: ActiveElection[] = [
  {
    id: 'past-1',
    title: 'Elección Directorio CAINCO',
    organization: 'Cámara de Industria, Comercio, Servicios y Turismo',
    status: 'FINALIZADA',
    votingSchedule: {
      from: '12 de marzo de 2025 - 08:00 hrs',
      to: '12 de marzo de 2025 - 18:00 hrs',
    },
    isFeatured: false,
  },
  {
    id: 'past-2',
    title: 'Elección Comité Interno Banco BISA',
    organization: 'Banco BISA',
    status: 'FINALIZADA',
    votingSchedule: {
      from: '8 de febrero de 2025 - 09:00 hrs',
      to: '8 de febrero de 2025 - 17:00 hrs',
    },
    isFeatured: false,
  },
  {
    id: 'past-3',
    title: 'Elecciones Estamentales UAGRM',
    organization: 'Universidad Autónoma Gabriel René Moreno',
    status: 'FINALIZADA',
    votingSchedule: {
      from: '20 de enero de 2025 - 08:30 hrs',
      to: '20 de enero de 2025 - 18:30 hrs',
    },
    isFeatured: false,
  },
  {
    id: 'past-4',
    title: 'Elección Sindicato PIL',
    organization: 'PIL Andina',
    status: 'FINALIZADA',
    votingSchedule: {
      from: '14 de diciembre de 2024 - 07:00 hrs',
      to: '14 de diciembre de 2024 - 16:00 hrs',
    },
    isFeatured: false,
  },
];

const mockLandingData: PublicLandingData = {
  hero: {
    title: {
      prefix: 'Elecciones',
      highlight: 'digitales',
    },
    subtitle: 'Con respaldo blockchain para mayor confianza y control en todo el proceso.',
    ctaText: 'Registrarme',
    videoEmbedUrl: 'https://www.youtube.com/embed/OZbxxuHNmQI?rel=0&modestbranding=1',
  },
  benefits: {
    title: 'Beneficios del sistema',
    audiences: [
      {
        id: 'organizers',
        label: 'Para Organizadores',
        cards: [
          {
            id: 'org-1',
            title: 'Elección fácil de configurar en web',
            description: 'Define el proceso paso a paso desde la plataforma web.',
            icon: 'desktop',
          },
          {
            id: 'org-2',
            title: 'Padrón claro y controlado',
            description: 'Define quiénes podrán participar.',
            icon: 'users',
          },
          {
            id: 'org-3',
            title: 'Página dedicada para cada elección',
            description: 'Revisa fechas, estado y empadronamiento.',
            icon: 'file-search',
          },
          {
            id: 'org-4',
            title: 'Diseñado para evitar el fraude electoral',
            description: 'Respaldo blockchain para una elección más segura y confiable.',
            icon: 'shield',
          },
        ],
      },
      {
        id: 'voters',
        label: 'Para Votantes',
        cards: [
          {
            id: 'voter-1',
            title: 'Identidad digital soberana',
            description: 'No guardamos tus documentos personales ni tu carnet.',
            icon: 'shield',
          },
          {
            id: 'voter-2',
            title: 'Verifica si estás empadronado',
            description: 'Consulta tu estado antes de la votación.',
            icon: 'users',
          },
          {
            id: 'voter-3',
            title: 'Voto anónimo y seguro',
            description: 'Nadie puede saber por quién votaste.',
            icon: 'check',
          },
          {
            id: 'voter-4',
            title: 'Consulta tu elección fácilmente',
            description: 'Revisa fechas, estado e información de la votación.',
            icon: 'file-search',
          },
        ],
      },
    ],
  },
  trust: {
    title: 'Confianza basada en uso real',
    institutionsLabel: 'Instituciones registradas',
    institutionsValue: '+40',
    electionsLabel: 'Elecciones pasadas',
    electionsValue: '+120',
    trustedTitle: 'Confían en nosotros',
    trustedSubtitle: 'Empresas, colegios y sindicatos',
    brands: [
      { id: '1', name: 'ASO', logoSrc: asoLogo, logoAlt: 'Aso Blockchain Bolivia' },
      { id: '2', name: 'CAINCO', logoSrc: caincoLogo, logoAlt: 'CAINCO' },
      { id: '3', name: 'Banco BISA', logoSrc: bisaLogo, logoAlt: 'Banco BISA' },
      { id: '4', name: 'BoA', logoSrc: boaLogo, logoAlt: 'BoA' },
      { id: '5', name: 'PIL', logoSrc: pilLogo, logoAlt: 'PIL' },
      { id: '6', name: 'The Strongest', logoSrc: tigreLogo, logoAlt: 'Club The Strongest' },
      { id: '7', name: 'YPFB', logoSrc: ypfbLogo, logoAlt: 'YPFB' },
      { id: '8', name: '+30', accent: '#94a3b8' },
    ],
  },
  howItWorks: {
    title: '¿Listo para comenzar?',
    steps: [
      {
        id: 'step-1',
        number: 1,
        title: 'Regístrate y solicita aprobación',
        description: 'Crea tu cuenta y habilita tu acceso.',
        icon: 'user-plus',
      },
      {
        id: 'step-2',
        number: 2,
        title: 'Configura la elección',
        description: 'Define fechas, candidatos, partidos y colores.',
        icon: 'settings',
      },
      {
        id: 'step-3',
        number: 3,
        title: 'Carga el padrón',
        description: 'Revisa habilitados antes de publicar.',
        icon: 'users',
      },
      {
        id: 'step-4',
        number: 4,
        title: 'Activa la elección',
        description: 'Deja todo listo para que los usuarios participen.',
        icon: 'pulse',
      },
      {
        id: 'step-5',
        number: 5,
        title: 'Tus electores votan desde la app',
        description: 'Consultan su estado y emiten su voto desde Tu Voto Decide.',
        icon: 'mobile',
      },
    ],
  },
  finalCta: {
    institutions: {
      title: 'Para instituciones',
      description: 'Organiza tu elección de forma segura, con respaldo blockchain y control total del padrón.',
      icon: 'institution',
      buttonText: 'Regístrate',
      buttonHref: '/registrarse',
    },
    voters: {
      title: 'Para votantes',
      description: 'Descarga la app Tu Voto Decide, verifica tu estado y vota desde tu celular.',
      icon: 'mobile',
      buttonText: 'Google Play',
      buttonSubtext: 'Consíguela en',
      buttonHref: 'https://play.google.com/store/apps/details?id=com.tuvotodecide',
      dark: true,
    },
  },
  contact: {
    whatsappNumber: '71234567',
    email: 'info@tuvotodecide.com',
    attentionHours: '08:30–20:00',
    brandName: 'Tu Voto Decide',
    socialLinks: [
      { id: 'facebook', href: 'https://facebook.com', label: 'Facebook', icon: 'facebook' },
      { id: 'twitter', href: 'https://twitter.com', label: 'Twitter', icon: 'twitter' },
      { id: 'instagram', href: 'https://instagram.com', label: 'Instagram', icon: 'instagram' },
      { id: 'linkedin', href: 'https://linkedin.com', label: 'LinkedIn', icon: 'linkedin' },
    ],
  },
};

export class PublicLandingRepositoryMock implements IPublicLandingRepository {
  async getLandingData(): Promise<PublicLandingData> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockLandingData;
  }

  async getActiveElections(): Promise<{ featured: null; others: [] }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      featured: null,
      others: [],
    };
  }

  async getPastElections(): Promise<ActiveElection[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockPastElections;
  }
}

export const publicLandingRepositoryMock = new PublicLandingRepositoryMock();
