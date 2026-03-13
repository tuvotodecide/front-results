export interface TableResultsLinkParams {
  electionId?: string | null;
  electionType?: string | null;
}

export const buildResultsTableLink = (
  tableCode: string,
  params?: TableResultsLinkParams,
) => {
  const search = new URLSearchParams();

  if (params?.electionId) {
    search.set("electionId", params.electionId);
  }

  if (params?.electionType) {
    search.set("electionType", params.electionType);
  }

  const query = search.toString();
  return query
    ? `/resultados/mesa/${tableCode}?${query}`
    : `/resultados/mesa/${tableCode}`;
};
