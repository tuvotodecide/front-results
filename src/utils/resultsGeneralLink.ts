export interface GeneralResultsLinkParams {
  electionId?: string | null;
  electionType?: string | null;
  departmentId?: string | null;
  municipalityId?: string | null;
}

export const buildGeneralResultsLink = (
  params?: GeneralResultsLinkParams,
) => {
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

  if (params?.municipalityId) {
    search.set("municipality", params.municipalityId);
  }

  const query = search.toString();
  return query ? `/resultados?${query}` : "/resultados";
};
