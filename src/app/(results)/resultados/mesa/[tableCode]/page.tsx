import ResultsTablePage from "@/domains/results/components/ResultsTablePage";

interface ResultsTableDetailRoutePageProps {
  params: Promise<{
    tableCode: string;
  }>;
}

export default async function ResultsTableDetailRoutePage({
  params,
}: Readonly<ResultsTableDetailRoutePageProps>) {
  const { tableCode } = await params;

  return <ResultsTablePage tableCode={tableCode} />;
}
