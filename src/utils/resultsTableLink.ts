import {
  buildResultsSearch,
  type ResultsContextParams,
} from "@/domains/results/lib/queryParams";

export type TableResultsLinkParams = Pick<
  ResultsContextParams,
  | "electionId"
  | "electionType"
  | "departmentId"
  | "provinceId"
  | "municipalityId"
  | "electoralSeatId"
  | "electoralLocationId"
>;

export const buildResultsTableLink = (
  tableCode: string,
  params?: TableResultsLinkParams,
) => {
  const query = buildResultsSearch(params);
  return query
    ? `/resultados/mesa/${tableCode}?${query}`
    : `/resultados/mesa/${tableCode}`;
};
