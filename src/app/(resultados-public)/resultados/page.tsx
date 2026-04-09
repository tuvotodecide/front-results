import { Suspense } from "react";
import ResultadosHomePage from "@/domains/resultados/screens/ResultadosHomePage";
import ResultadosGeneralesPage from "@/domains/resultados/screens/ResultadosGeneralesPage";

type ResultadosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const hasResultsContext = (
  searchParams?: Record<string, string | string[] | undefined>,
) => {
  const keys = [
    "electionId",
    "electionType",
    "department",
    "province",
    "municipality",
    "electoralSeat",
    "electoralLocation",
  ];

  return keys.some((key) => {
    const value = searchParams?.[key];
    if (Array.isArray(value)) {
      return value.some((entry) => entry?.trim());
    }
    return Boolean(value?.trim());
  });
};

export default async function ResultadosPage({
  searchParams,
}: ResultadosPageProps) {
  const resolvedSearchParams = await searchParams;
  const shouldShowGeneralResults = hasResultsContext(resolvedSearchParams);

  return (
    <Suspense fallback={null}>
      {shouldShowGeneralResults ? (
        <ResultadosGeneralesPage />
      ) : (
        <ResultadosHomePage />
      )}
    </Suspense>
  );
}
