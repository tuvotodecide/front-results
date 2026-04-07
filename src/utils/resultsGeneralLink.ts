import {
  buildResultsSearch,
  type ResultsContextParams,
} from "@/domains/results/lib/queryParams";

export type GeneralResultsLinkParams = ResultsContextParams;

export const buildGeneralResultsLink = (params?: GeneralResultsLinkParams) => {
  const query = buildResultsSearch(params);
  return query ? `/resultados?${query}` : "/resultados";
};
