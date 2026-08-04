import type { PublicElectionDetail } from "@/features/publicElectionDetail/types";
import type { PublicLandingData } from "@/features/publicLanding/types";
import type { BallotType } from "@/types/ballot";

export const matrix13LandingData: PublicLandingData = {
  hero: {
    title: { prefix: "Elecciones", highlight: "públicas" },
    subtitle: "Información pública para consultar votaciones visibles.",
    ctaText: "Registrarme",
    videoEmbedUrl: "https://video.test/landing",
  },
  benefits: {
    title: "Beneficios públicos",
    audiences: [
      {
        id: "organizers",
        label: "Instituciones",
        cards: [
          {
            id: "benefit-1",
            title: "Información verificable",
            description: "Consulta una votación pública.",
            icon: "check",
          },
        ],
      },
      {
        id: "voters",
        label: "Votantes",
        cards: [
          {
            id: "benefit-2",
            title: "Consulta accesible",
            description: "Revisa el estado de una elección.",
            icon: "users",
          },
        ],
      },
    ],
  },
  trust: {
    title: "Confianza pública",
    institutionsLabel: "Instituciones",
    institutionsValue: "+10",
    electionsLabel: "Elecciones",
    electionsValue: "+20",
    trustedTitle: "Instituciones visibles",
    trustedSubtitle: "Información pública controlada",
    brands: [{ id: "brand-1", name: "Institución pública" }],
  },
  howItWorks: {
    title: "Cómo consultar",
    steps: [
      {
        id: "step-1",
        number: 1,
        title: "Consulta",
        description: "Abre una elección pública.",
        icon: "users",
      },
    ],
  },
  finalCta: {
    institutions: {
      title: "Para instituciones",
      description: "Organiza una votación.",
      icon: "institution",
      buttonText: "Registrarme",
      buttonHref: "/votacion/registrarse",
    },
    voters: {
      title: "Para votantes",
      description: "Consulta tus elecciones.",
      icon: "mobile",
      buttonText: "Aplicación",
      buttonHref: "https://app.test/download",
      dark: true,
    },
  },
  contact: {
    whatsappNumber: "70000000",
    email: "publico@tvd.test",
    attentionHours: "08:00-18:00",
    brandName: "Tu Voto Decide",
    socialLinks: [
      { id: "social-1", href: "https://social.test", label: "Red pública", icon: "facebook" },
    ],
  },
};

export const makePublicElectionDetail = (
  overrides: Partial<PublicElectionDetail> = {},
): PublicElectionDetail => ({
  id: "evt-publico",
  title: "Elección pública",
  subtitle: "Institución pública",
  isReferendum: false,
  status: "FINISHED",
  schedule: {
    from: "1 de agosto de 2026, 08:00 hrs",
    to: "1 de agosto de 2026, 18:00 hrs",
  },
  results: {
    totalVotes: 25,
    candidates: [
      {
        id: "option-a",
        name: "Ana Pérez",
        party: "Frente A",
        colorHex: "#2563eb",
        votes: 15,
        percent: 60,
      },
      {
        id: "option-b",
        name: "Bruno Lima",
        party: "Frente B",
        colorHex: "#059669",
        votes: 10,
        percent: 40,
      },
      {
        id: "blank",
        name: "Votos en Blanco",
        party: "Votos en Blanco",
        colorHex: "#6b7280",
        votes: 0,
        percent: 0,
      },
    ],
  },
  winnerCandidateId: "option-a",
  publicEligibilityEnabled: true,
  ballotParties: [
    {
      id: "option-a",
      name: "Frente A",
      colorHex: "#2563eb",
      candidates: [
        {
          id: "candidate-a",
          fullName: "Ana Pérez",
          positionName: "Presidencia",
        },
      ],
    },
  ],
  ...overrides,
});

export const makePublicElectionResponse = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-publico",
  name: "Elección pública",
  objective: "Institución pública",
  phase: "RESULTS",
  votingStart: "2026-08-01T08:00:00.000Z",
  votingEnd: "2026-08-01T18:00:00.000Z",
  resultsPublishAt: "2026-08-01T20:00:00.000Z",
  isReferendum: false,
  publicEligibilityEnabled: true,
  resultsAvailable: true,
  options: [
    {
      id: "option-a",
      name: "Frente A",
      color: "#2563eb",
      candidates: [{ id: "candidate-a", name: "Ana Pérez", roleName: "Presidencia" }],
    },
    {
      id: "option-b",
      name: "Frente B",
      color: "#059669",
      candidates: [{ id: "candidate-b", name: "Bruno Lima", roleName: "Vicepresidencia" }],
    },
  ],
  results: [
    { option: "Frente A", votes: 15 },
    { option: "Frente B", votes: 10 },
    { option: "BLANK", votes: 2 },
  ],
  ...overrides,
});

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const matrix13PublicBallot: BallotType = {
  _id: "ballot-publico",
  tableNumber: "12",
  tableCode: "MESA-12",
  electionId: "evt-publico",
  electoralLocationId: "location-1",
  location: {
    department: "La Paz",
    province: "Murillo",
    municipality: "La Paz",
    electoralSeat: "Centro",
    electoralLocationName: "Recinto Central",
    district: "Distrito 1",
    zone: "Zona pública",
    circunscripcion: { number: 1, type: "uninominal", name: "Circunscripción 1" },
  },
  votes: {
    parties: { validVotes: 15, nullVotes: 1, blankVotes: 2, partyVotes: [], totalVotes: 18 },
    deputies: { validVotes: 15, nullVotes: 1, blankVotes: 2, partyVotes: [], totalVotes: 18 },
  },
  ipfsUri: "ipfs://public-metadata",
  ipfsCid: "public-image",
  image: "ipfs://public-image",
  recordId: "record-publico",
  tableIdIpfs: "table-publico",
  status: "processed",
  valuable: true,
  version: 2,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  __v: 0,
};
