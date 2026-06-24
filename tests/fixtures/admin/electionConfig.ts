import type { PartyWithCandidates, Position } from "@/features/electionConfig/types";
import type { EventRole, VotingEvent, VotingOption } from "@/store/votingEvents/types";

export const draftVotingEvent: VotingEvent = {
  id: "evt-config",
  tenantId: "tenant-admin",
  name: "Eleccion consejo 2027",
  chainRequestId: "chain-evt-config",
  objective: "Elegir representantes institucionales",
  isReferendum: false,
  votingStart: "2027-06-01T12:00:00.000Z",
  votingEnd: "2027-06-01T18:00:00.000Z",
  resultsPublishAt: "2027-06-01T19:00:00.000Z",
  publishDeadline: "2027-06-01T06:00:00.000Z",
  state: "DRAFT",
  status: "DRAFT",
  publicEligibilityEnabled: false,
  publicEligibility: false,
};

export const referendumVotingEvent: VotingEvent = {
  ...draftVotingEvent,
  id: "evt-referendum",
  name: "Consulta institucional 2027",
  objective: "Aprobar reglamento institucional",
  isReferendum: true,
};

export const adminEventRoles: EventRole[] = [
  {
    id: "role-president",
    eventId: "evt-config",
    name: "Presidencia",
    maxWinners: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "role-secretary",
    eventId: "evt-config",
    name: "Secretaria",
    maxWinners: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const adminPositions: Position[] = adminEventRoles.map((role) => ({
  id: role.id,
  name: role.name,
  electionId: role.eventId,
  createdAt: role.createdAt ?? "2026-01-01T00:00:00.000Z",
}));

export const adminVotingOptions: VotingOption[] = [
  {
    id: "option-blue",
    eventId: "evt-config",
    name: "Lista Azul",
    color: "#1D4ED8",
    colors: ["#1D4ED8", "#93C5FD"],
    logoUrl: "data:image/png;base64,logo-blue",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    candidates: [
      {
        id: "candidate-ana",
        optionId: "option-blue",
        name: "Ana Presidenta",
        photoUrl: "data:image/png;base64,ana",
        roleName: "Presidencia",
      },
      {
        id: "candidate-luis",
        optionId: "option-blue",
        name: "Luis Secretario",
        photoUrl: "data:image/png;base64,luis",
        roleName: "Secretaria",
      },
    ],
  },
];

export const adminPartyWithCandidates: PartyWithCandidates = {
  id: "option-blue",
  electionId: "evt-config",
  name: "Lista Azul",
  colorHex: "#1D4ED8",
  colors: ["#1D4ED8", "#93C5FD"],
  logoUrl: "data:image/png;base64,logo-blue",
  createdAt: "2026-01-01T00:00:00.000Z",
  candidates: [
    {
      id: "candidate-ana",
      partyId: "option-blue",
      positionId: "role-president",
      positionName: "Presidencia",
      fullName: "Ana Presidenta",
      photoUrl: "data:image/png;base64,ana",
    },
    {
      id: "candidate-luis",
      partyId: "option-blue",
      positionId: "role-secretary",
      positionName: "Secretaria",
      fullName: "Luis Secretario",
      photoUrl: "data:image/png;base64,luis",
    },
  ],
};
