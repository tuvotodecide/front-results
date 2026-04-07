export type ResultsElectionType =
  | "municipal"
  | "departamental"
  | "presidential"
  | "council"
  | "assembly"
  | "deputies"
  | string;

export const readElectionIdParam = (
  searchParams: Pick<URLSearchParams, "get"> | null,
): string | null => {
  const value = searchParams?.get("electionId");
  return value?.trim() || null;
};

export const normalizeResultsElectionType = (
  electionType?: ResultsElectionType | null,
) => {
  if (electionType === "municipal" || electionType === "council") {
    return "municipal";
  }

  if (electionType === "departamental" || electionType === "assembly") {
    return "departamental";
  }

  if (electionType === "presidential" || electionType === "deputies") {
    return "presidential";
  }

  return undefined;
};

export interface ResultsContextParams {
  electionId?: string | null;
  electionType?: string | null;
  departmentId?: string | null;
  provinceId?: string | null;
  municipalityId?: string | null;
  electoralSeatId?: string | null;
  electoralLocationId?: string | null;
}

export const buildResultsSearch = (params?: ResultsContextParams) => {
  const search = new URLSearchParams();

  if (params?.electionId) {
    search.set("electionId", params.electionId);
  }

  if (params?.electionType) {
    search.set("electionType", params.electionType);
  }

  if (params?.departmentId) {
    search.set("department", params.departmentId);
  }

  if (params?.provinceId) {
    search.set("province", params.provinceId);
  }

  if (params?.municipalityId) {
    search.set("municipality", params.municipalityId);
  }

  if (params?.electoralSeatId) {
    search.set("electoralSeat", params.electoralSeatId);
  }

  if (params?.electoralLocationId) {
    search.set("electoralLocation", params.electoralLocationId);
  }

  return search.toString();
};
