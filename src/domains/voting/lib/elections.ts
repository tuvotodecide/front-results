import type { VotingEvent } from "@/store/votingEvents/types";

export const votingStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  ACTIVE: "Activa",
  CLOSED: "Finalizada",
  RESULTS_PUBLISHED: "Resultados publicados",
};

export const votingStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  CLOSED: "bg-amber-100 text-amber-700",
  RESULTS_PUBLISHED: "bg-violet-100 text-violet-700",
};

export const hasDraftAlreadyStarted = (event: VotingEvent) =>
  event.status === "DRAFT" &&
  Boolean(event.votingStart && new Date(event.votingStart).getTime() <= Date.now());

export const formatVotingDate = (dateString?: string | null) => {
  if (!dateString) return "No definida";

  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const resolveVotingEventRoute = (event: VotingEvent) => {
  if (hasDraftAlreadyStarted(event)) {
    return null;
  }

  if (event.status === "DRAFT") {
    return `/elections/${event.id}/config/cargos`;
  }

  if (
    event.status === "PUBLISHED" ||
    event.status === "CLOSED" ||
    event.status === "RESULTS_PUBLISHED"
  ) {
    return `/elections/${event.id}/status`;
  }

  return `/elections/${event.id}/config/review`;
};
